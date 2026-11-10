import { Injectable, Logger } from '@nestjs/common';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  buildDemoDiagnostic,
  DemarcheTypeEnum,
  DemarchePcaetVulnerabiliteHorizonEnum,
  isDemarcheDocumentInclusionDeclarable,
  type DemarcheDocumentDefinition,
  type DemarcheDocumentEtape,
} from '@tet/domain/demarches';
import { CreateAndLinkPlanService } from '../create-and-link-plan/create-and-link-plan.service';
import { UpdateDiagnosticIndicateursValeursService } from '../diagnostic/update-diagnostic-indicateurs-valeurs/update-diagnostic-indicateurs-valeurs.service';
import { AddDemarchePcaetDocumentService } from '../documents/add-document/add-document.service';
import { SetDemarchePcaetDocumentCouvertureService } from '../documents/set-document-couverture/set-document-couverture.service';
import { UpdateDemarchePcaetService } from '../update-demarche-pcaet/update-demarche-pcaet.service';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import { DemarchePcaetVulnerabiliteRepository } from '../shared/demarche-pcaet-vulnerabilite.repository';
import {
  DEMO_DOCUMENTS,
  DemarchePcaetDemoFichiersService,
} from './demarche-pcaet-demo-fichiers.service';
import { DemarchePcaetDemoRepository } from './demarche-pcaet-demo.repository';
import { DemarchePcaetDemoService } from './demarche-pcaet-demo.service';
import {
  DemarchePcaetDemoErrorEnum,
  type DemarchePcaetDemoError,
} from './demo.errors';
import type { CompleterEtapeDemoInput } from './demo.input';

const DEMO_PLAN_NOM = 'Plan climat (démonstration)';

type DemarcheRef = { collectiviteId: number; demarcheId: number };

/** Une pièce relève de ce temps du dossier : `both` appartient aux deux. */
const isDansEtape = (
  definition: DemarcheDocumentDefinition,
  etape: DemarcheDocumentEtape
): boolean => definition.etape === etape || definition.etape === 'both';

/**
 * « Compléter l'étape » du mode démo : écrit ce qu'une collectivité aurait
 * saisi, par les services ordinaires. Les règles de complétude restent les
 * vraies : c'est la saisie qui est simulée, pas le feu vert.
 */
@Injectable()
export class CompleterEtapeDemoService {
  private readonly logger = new Logger(CompleterEtapeDemoService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly demoService: DemarchePcaetDemoService,
    private readonly fichiersService: DemarchePcaetDemoFichiersService,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly documentsRepository: DemarcheDocumentsRepository,
    private readonly planActionsRepository: DemarchePlanActionsRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository,
    private readonly addDocumentService: AddDemarchePcaetDocumentService,
    private readonly setCouvertureService: SetDemarchePcaetDocumentCouvertureService,
    private readonly updateValeursService: UpdateDiagnosticIndicateursValeursService,
    private readonly createAndLinkPlanService: CreateAndLinkPlanService,
    private readonly updateDemarcheService: UpdateDemarchePcaetService,
    private readonly demoRepository: DemarchePcaetDemoRepository
  ) {}

  async completer(
    { etape, ...ref }: CompleterEtapeDemoInput,
    { user }: ServiceSecondArg
  ): Promise<Result<undefined, DemarchePcaetDemoError>> {
    if (!(await this.demoService.isDemo(user, ref.collectiviteId))) {
      return failure(DemarchePcaetDemoErrorEnum.DEMO_NON_ACTIVE);
    }
    const demarche = await this.refRepository.findRef(ref);
    if (!demarche) {
      return failure(DemarchePcaetDemoErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }

    const result = await (() => {
      switch (etape) {
        case 'documents':
          return this.completerDocuments(ref, 'amont', user);
        case 'documentsAval':
          return this.completerDocuments(ref, 'aval', user);
        case 'diagnostic':
          return this.completerDiagnostic(ref, user);
        case 'plan':
          return this.completerPlan(ref, user);
      }
    })();

    if (result.success) {
      this.logger.log(
        `Mode démo : étape ${etape} complétée sur la démarche PCAET ${ref.demarcheId} par ${user.id}`
      );
    }
    return result;
  }

  /**
   * Chaque pièce du temps visé reçoit son document de démo ; celles qui n'en
   * ont pas (plan qualité de l'air, PLCF) sont déclarées comprises dans une
   * autre, comme le modèle le permet.
   */
  private async completerDocuments(
    ref: DemarcheRef,
    etape: DemarcheDocumentEtape,
    user: AuthenticatedUser
  ): Promise<Result<undefined, DemarchePcaetDemoError>> {
    const snapshot = await this.documentsRepository.loadSnapshot({
      ...ref,
      demarcheType: DemarcheTypeEnum.PCAET,
    });
    const deposees = new Set(
      snapshot.documents
        .filter((document) => document.etape === etape)
        .map((document) => document.documentId)
    );
    const aCompleter = snapshot.definitions.filter(
      (definition) =>
        isDansEtape(definition, etape) && !deposees.has(definition.id)
    );

    // Les fichiers d'abord, hors transaction : le stockage n'en fait pas partie.
    const fichierIds = new Map<string, number>();
    for (const definition of aCompleter) {
      const demoFichier = DEMO_DOCUMENTS[definition.id];
      if (!demoFichier) {
        continue;
      }
      const fichier = await this.fichiersService.ensureFichier(
        ref.collectiviteId,
        demoFichier
      );
      if (!fichier.success) {
        return failure(DemarchePcaetDemoErrorEnum.DEMO_FICHIER_ERROR);
      }
      fichierIds.set(definition.id, fichier.data.id);
    }

    return this.transactionManager.executeSingle(async (tx) => {
      for (const definition of aCompleter) {
        const fichierId = fichierIds.get(definition.id);
        const written =
          fichierId !== undefined
            ? await this.addDocumentService.addDocument(
                { ...ref, documentId: definition.id, etape, fichierId },
                { user, tx }
              )
            : definition.requis &&
              isDemarcheDocumentInclusionDeclarable(definition)
            ? await this.setCouvertureService.setCouverture(
                { ...ref, documentId: definition.id, couvert: true },
                { user, tx }
              )
            : success(undefined);
        if (!written.success) {
          return this.echec(ref, `pièce ${definition.id}`, written.error);
        }
      }
      return success(undefined);
    });
  }

  private async completerDiagnostic(
    ref: DemarcheRef,
    user: AuthenticatedUser
  ): Promise<Result<undefined, DemarchePcaetDemoError>> {
    return this.transactionManager.executeSingle(async (tx) => {
      const diagnostic = await this.diagnosticService.loadPayload(ref, tx);
      const demo = buildDemoDiagnostic(diagnostic);

      if (demo.valeurs.length > 0) {
        const written = await this.updateValeursService.updateValeurs(
          { ...ref, valeurs: demo.valeurs },
          { user, tx }
        );
        if (!written.success) {
          return this.echec(ref, 'diagnostic', written.error);
        }
      }

      for (const ligne of demo.vulnerabilite) {
        for (const [horizon, valeur] of [
          [
            DemarchePcaetVulnerabiliteHorizonEnum.MAINTENANT,
            ligne.niveauMaintenant,
          ],
          [DemarchePcaetVulnerabiliteHorizonEnum.H2050, ligne.niveau2050],
          [DemarchePcaetVulnerabiliteHorizonEnum.H2100, ligne.niveau2100],
        ] as const) {
          await this.vulnerabiliteRepository.patchLigne(
            {
              demarcheId: ref.demarcheId,
              thematiqueId: ligne.thematiqueId,
              patch: { niveau: { horizon, valeur } },
              userId: user.id,
            },
            tx
          );
        }
        await this.vulnerabiliteRepository.patchLigne(
          {
            demarcheId: ref.demarcheId,
            thematiqueId: ligne.thematiqueId,
            patch: {
              objectifs2050: ligne.objectifs2050,
              objectifs2100: ligne.objectifs2100,
            },
            userId: user.id,
          },
          tx
        );
      }
      return success(undefined);
    });
  }

  /**
   * Un plan de démo rattaché, si le programme d'actions n'en a encore aucun :
   * celui d'une démonstration précédente quand il existe, pour que les
   * démonstrations successives n'empilent pas les plans de la collectivité.
   */
  private async completerPlan(
    ref: DemarcheRef,
    user: AuthenticatedUser
  ): Promise<Result<undefined, DemarchePcaetDemoError>> {
    return this.transactionManager.executeSingle(async (tx) => {
      const planActionIds = await this.planActionsRepository.listPlanActionIds(
        ref.demarcheId,
        tx
      );
      if (planActionIds.length > 0) {
        return success(undefined);
      }

      const planDemoId = await this.demoRepository.findPlanDemo(
        {
          collectiviteId: ref.collectiviteId,
          demarcheId: ref.demarcheId,
          nom: DEMO_PLAN_NOM,
        },
        tx
      );
      if (planDemoId !== null) {
        const linked = await this.updateDemarcheService.updateDemarchePcaet(
          { ...ref, planActionIds: [planDemoId] },
          { user, tx }
        );
        return linked.success
          ? success(undefined)
          : this.echec(ref, 'plan', linked.error);
      }

      // Dans la transaction : `createAndLinkPlan` ne lance alors pas la
      // complétion automatique des secteurs, sans objet pour un plan vide.
      const created = await this.createAndLinkPlanService.createAndLinkPlan(
        { ...ref, nom: DEMO_PLAN_NOM },
        { user, tx }
      );
      if (!created.success) {
        return this.echec(ref, 'plan', created.error);
      }
      return success(undefined);
    });
  }

  private echec(
    ref: DemarcheRef,
    quoi: string,
    cause: unknown
  ): Result<undefined, DemarchePcaetDemoError> {
    this.logger.error(
      `Mode démo : ${quoi} non complété sur la démarche PCAET ${
        ref.demarcheId
      } : ${String(cause)}`
    );
    return failure(DemarchePcaetDemoErrorEnum.DEMO_ECRITURE_ERROR);
  }
}
