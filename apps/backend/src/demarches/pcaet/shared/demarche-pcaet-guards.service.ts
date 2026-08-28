import { Injectable, Logger } from '@nestjs/common';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  DemarcheTypeEnum,
  evaluateTransitions,
  getRequiredGuards,
  isDemarcheDocumentsAvalComplet,
  isDemarcheDossierDocumentsComplet,
  isDemarchePcaetAmontModifiable,
  isDemarchePcaetAvalModifiable,
  isDemarchePcaetAvisTousRendus,
  isDemarchePcaetDiagnosticComplet,
  isDemarchePcaetPilote,
  type DemandeAvisAchevement,
  type DemarchePcaet,
  type DemarchePcaetGuardId,
  type DemarchePcaetGuardResults,
  type DemarchePcaetStatus,
  type PcaetDiagnostic,
} from '@tet/domain/demarches';
import { DemarchePcaetDiagnosticService } from './demarche-pcaet-diagnostic.service';
import { DemarchePcaetPilotesRepository } from './demarche-pcaet-pilotes.repository';
import { PcaetAvisRepository } from './pcaet-avis.repository';

/** Démarche dont les guards doivent être évalués. */
export type DemarchePcaetGuardTarget = {
  id: number;
  collectiviteId: number;
  status: DemarchePcaetStatus;
  /** Échéance de remise des avis, figée à la transmission. */
  avisDeadlineAt: string | null;
  /** Dernière transmission pour avis (null = jamais transmise). */
  transmittedAt: string | null;
};

/**
 * Tout ce dont les guards ont besoin, lu en une fois. Un champ laissé à
 * `undefined` est une information non lue : le guard qui en dépend reste sans
 * résultat, donc la transition est refusée (fail-closed).
 */
export type DemarchePcaetGuardContext = DemarchePcaetGuardTarget & {
  pilotes: readonly { userId?: string | null }[];
  /** Plans rattachés au programme d'actions de la démarche. */
  planActionIds?: readonly number[];
  /**
   * Environnements de démonstration : le dossier se passe d'un diagnostic
   * complet (cf. DEMARCHE_PCAET_BYPASS_DIAGNOSTIC). Faux partout ailleurs.
   */
  isDiagnosticBypassed?: boolean;
  /** Pièces amont requises couvertes, au sens de la règle documentaire. */
  documentsComplets?: boolean;
  /** Diagnostic tel qu'il est en base ; sert aussi aux photos figées. */
  diagnostic?: PcaetDiagnostic;
  /** Pièces aval requises (délibération d'adoption…) déposées. */
  documentsAvalComplets?: boolean;
  /** Demandes d'avis du dossier et titres déjà validés sur chacune. */
  demandesAvis?: readonly DemandeAvisAchevement[];
  /** L'évaluation finale du PCAET n'est pas encore modélisée en base. */
  evaluationFinaleDeposee?: boolean;
};

/**
 * `user` est nul quand c'est le système qui applique une transition : aucun
 * guard d'acteur ne peut alors se prononcer, et répondre `undefined` bloque
 * comme il faut les transitions qui en dépendent.
 */
type GuardEvaluator = (
  context: DemarchePcaetGuardContext,
  user: AuthenticatedUser | null
) => boolean | undefined;

/**
 * Un évaluateur par guard du workflow — le `Record` est exhaustif, donc
 * déclarer un guard sans savoir le calculer ne compile pas. Renvoyer
 * `undefined` signifie « je ne sais pas », ce qui bloque la transition.
 */
const GUARD_EVALUATORS: Record<DemarchePcaetGuardId, GuardEvaluator> = {
  estPilote: (context, user) =>
    user ? isDemarchePcaetPilote(user.id, context.pilotes) : undefined,

  // Un dossier complet, c'est l'ensemble des pièces requises couvertes, le
  // diagnostic renseigné ET un programme d'actions rattaché.
  dossierComplet: (context) =>
    context.documentsComplets === undefined ||
    context.diagnostic === undefined ||
    context.planActionIds === undefined
      ? undefined
      : context.documentsComplets &&
        (context.isDiagnosticBypassed === true ||
          isDemarchePcaetDiagnosticComplet(context.diagnostic)) &&
        context.planActionIds.length > 0,

  avisTousRendus: (context) =>
    context.demandesAvis === undefined
      ? undefined
      : isDemarchePcaetAvisTousRendus(context.demandesAvis),

  // Le délai d'avis n'a de sens qu'une fois la démarche transmise ; son
  // échéance est figée en base à ce moment-là.
  delaiAvisEcoule: (context) =>
    context.avisDeadlineAt === null
      ? undefined
      : new Date(context.avisDeadlineAt).getTime() <= Date.now(),

  // Les évaluations de PCAET ne sont pas encore modélisées : le guard reste
  // sans résultat, et `archiver` donc fermée.
  evaluationFinaleDeposee: (context) => context.evaluationFinaleDeposee,

  documentsAvalComplets: (context) => context.documentsAvalComplets,
};

/**
 * Évaluateur unique des guards du workflow, côté serveur : le front ne
 * recalcule rien, il lit l'état des transitions renvoyé dans les réponses tRPC.
 */
@Injectable()
export class DemarchePcaetGuardsService {
  private readonly logger = new Logger(DemarchePcaetGuardsService.name);

  constructor(
    private readonly pilotesRepository: DemarchePcaetPilotesRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly documentsRepository: DemarcheDocumentsRepository,
    private readonly planActionsRepository: DemarchePlanActionsRepository,
    private readonly avisRepository: PcaetAvisRepository,
    private readonly configurationService: ConfigurationService
  ) {}

  /**
   * Le contournement s'annonce à chaque évaluation plutôt qu'une fois au
   * démarrage : un dossier transmis sans diagnostic complet doit être
   * explicable en lisant les logs de la transmission.
   */
  private isDiagnosticBypassed(): boolean {
    const isBypassed =
      this.configurationService.get('DEMARCHE_PCAET_BYPASS_DIAGNOSTIC') ===
      true;
    if (isBypassed) {
      this.logger.warn(
        'DEMARCHE_PCAET_BYPASS_DIAGNOSTIC actif : le diagnostic n’est pas exigé pour compléter le dossier PCAET (environnement de démonstration)'
      );
    }
    return isBypassed;
  }

  /**
   * Lit ce dont dépendent les guards du statut courant, et rien de plus : le
   * workflow dit quels guards comptent ici, donc quelles requêtes valent la
   * peine d'être faites.
   */
  async loadContext(
    demarche: DemarchePcaetGuardTarget,
    tx?: Transaction
  ): Promise<DemarchePcaetGuardContext> {
    const requiredGuards = getRequiredGuards(demarche.status);
    const needsPilotes = requiredGuards.includes('estPilote');
    const needsDossier = requiredGuards.includes('dossierComplet');
    const needsDocumentsAval = requiredGuards.includes('documentsAvalComplets');
    const needsAvisRendus = requiredGuards.includes('avisTousRendus');

    const [
      pilotes,
      documentsSnapshot,
      diagnostic,
      planActionIds,
      demandesAvis,
    ] = await Promise.all([
      needsPilotes
        ? this.pilotesRepository.listPiloteUserIds(demarche.id, tx)
        : Promise.resolve([]),
      needsDossier || needsDocumentsAval
        ? this.documentsRepository.loadSnapshot(
            {
              demarcheId: demarche.id,
              demarcheType: DemarcheTypeEnum.PCAET,
              collectiviteId: demarche.collectiviteId,
            },
            tx
          )
        : Promise.resolve(undefined),
      needsDossier
        ? this.diagnosticService.loadPayload(
            {
              demarcheId: demarche.id,
              collectiviteId: demarche.collectiviteId,
            },
            tx
          )
        : Promise.resolve(undefined),
      needsDossier
        ? this.planActionsRepository.listPlanActionIds(demarche.id, tx)
        : Promise.resolve(undefined),
      needsAvisRendus
        ? this.avisRepository.listAchevementDemandes(demarche.id, tx)
        : Promise.resolve(undefined),
    ]);

    return {
      ...demarche,
      pilotes,
      planActionIds,
      demandesAvis,
      isDiagnosticBypassed: needsDossier ? this.isDiagnosticBypassed() : false,
      diagnostic,
      documentsComplets:
        needsDossier && documentsSnapshot
          ? isDemarcheDossierDocumentsComplet(documentsSnapshot)
          : undefined,
      documentsAvalComplets:
        needsDocumentsAval && documentsSnapshot
          ? isDemarcheDocumentsAvalComplet(documentsSnapshot)
          : undefined,
    };
  }

  computeGuardResults(
    context: DemarchePcaetGuardContext,
    user: AuthenticatedUser | null
  ): DemarchePcaetGuardResults {
    const guardResults: DemarchePcaetGuardResults = {};
    for (const guard of getRequiredGuards(context.status)) {
      guardResults[guard] = GUARD_EVALUATORS[guard](context, user);
    }
    return guardResults;
  }

  /**
   * L'état des transitions pour cet utilisateur, et ce que le dossier accepte
   * encore comme écriture — qui ne dépend, lui, que du statut.
   */
  computeAvailableActions(
    context: DemarchePcaetGuardContext,
    user: AuthenticatedUser | null
  ): Pick<DemarchePcaet, 'transitions' | 'amontModifiable' | 'avalModifiable'> {
    return {
      transitions: evaluateTransitions(
        context.status,
        this.computeGuardResults(context, user)
      ),
      amontModifiable: isDemarchePcaetAmontModifiable(context.status),
      avalModifiable: isDemarchePcaetAvalModifiable(context.status),
    };
  }

  /** Complète un DTO avec ce que l'utilisateur peut y faire. */
  async enrich(
    demarche: DemarchePcaet,
    user: AuthenticatedUser | null,
    tx?: Transaction
  ): Promise<DemarchePcaet> {
    const context = await this.loadContext(demarche, tx);
    return {
      ...demarche,
      ...this.computeAvailableActions(context, user),
    };
  }

  async enrichAll(
    demarches: DemarchePcaet[],
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<DemarchePcaet[]> {
    return Promise.all(
      demarches.map((demarche) => this.enrich(demarche, user, tx))
    );
  }
}
