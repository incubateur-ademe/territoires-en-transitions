import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  demarchePcaetWorkflow,
  DemarchePcaetStatusEnum,
  isDemarchePcaetPilote,
  type DemarchePcaet,
  type DemarchePcaetGuardResults,
  type DemarchePcaetStatus,
  type DemarchePcaetTransition,
} from '@tet/domain/demarches';

type DemarcheGuardContext = {
  status: DemarchePcaetStatus;
  pilotes: readonly { userId?: string | null }[];
  /** Échéance de remise des avis, figée à la transmission. */
  avisDeadlineAt: string | null;
  /** Programme d'actions rattaché à la démarche, s'il l'est. */
  planActionId: number | null;
};

/**
 * Ce que l'appelant a déjà lu en base pour les guards qui en dépendent. Non
 * renseigné = guard sans résultat, donc transition refusée (fail-closed).
 */
type DemarcheGuardInputs = {
  /** Pièces requises couvertes, au sens de la règle documentaire du domaine. */
  documentsComplets?: boolean;
  /** Lignes requises du diagnostic renseignées, au sens de la règle du domaine. */
  diagnosticComplet?: boolean;
};

/**
 * Évaluateur unique des guards du workflow, côté serveur : le front ne
 * recalcule rien, il reçoit `availableTransitions` dans les réponses tRPC.
 *
 * Service volontairement pur et synchrone : ce qui demande un accès base est lu
 * par l'appelant et passé en `inputs`.
 */
@Injectable()
export class DemarchePcaetGuardsService {
  /**
   * Résultats autoritaires des guards pour un utilisateur donné.
   * `evaluationFinaleDeposee` reste sans résultat (fail-closed) tant que les
   * évaluations ne sont pas modélisées.
   */
  /**
   * La complétude ne conditionne que la transmission, donc l'élaboration.
   * Ailleurs, `inputs` n'est jamais lu : l'appelant s'épargne les lectures.
   */
  needsCompletionInputs(status: DemarchePcaetStatus): boolean {
    return status === DemarchePcaetStatusEnum.EN_ELABORATION;
  }

  computeGuardResults(
    demarche: DemarcheGuardContext,
    user: AuthenticatedUser,
    inputs: DemarcheGuardInputs = {}
  ): DemarchePcaetGuardResults {
    const guardResults: DemarchePcaetGuardResults = {
      estPilote: isDemarchePcaetPilote(user.id, demarche.pilotes),
    };

    // Un dossier complet, c'est l'ensemble des pièces requises couvertes, le
    // diagnostic renseigné ET un programme d'actions rattaché : le serveur est
    // seul juge des trois.
    if (
      this.needsCompletionInputs(demarche.status) &&
      inputs.documentsComplets !== undefined &&
      inputs.diagnosticComplet !== undefined
    ) {
      guardResults.dossierComplet =
        inputs.documentsComplets &&
        inputs.diagnosticComplet &&
        demarche.planActionId !== null;
    }

    // Le délai d'avis n'a de sens que pour une démarche transmise ; son
    // échéance est figée en base à la transmission.
    if (
      demarche.status === DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS &&
      demarche.avisDeadlineAt !== null
    ) {
      guardResults.delaiAvisEcoule =
        new Date(demarche.avisDeadlineAt).getTime() <= Date.now();
    }

    return guardResults;
  }

  computeAvailableTransitions(
    demarche: DemarcheGuardContext,
    user: AuthenticatedUser,
    inputs: DemarcheGuardInputs = {}
  ): DemarchePcaetTransition[] {
    const guardResults = this.computeGuardResults(demarche, user, inputs);
    return demarchePcaetWorkflow.getEnabledTransitions(demarche.status).filter(
      (transition) =>
        demarchePcaetWorkflow.apply(demarche.status, transition, {
          guardResults,
        }).success
    );
  }

  /** Complète un DTO avec les transitions applicables par l'utilisateur. */
  enrich(
    demarche: DemarchePcaet,
    user: AuthenticatedUser,
    inputs: DemarcheGuardInputs = {}
  ): DemarchePcaet {
    return {
      ...demarche,
      availableTransitions: this.computeAvailableTransitions(
        demarche,
        user,
        inputs
      ),
    };
  }
}
