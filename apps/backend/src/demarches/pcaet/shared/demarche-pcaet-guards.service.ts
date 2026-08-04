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
};

/**
 * Évaluateur unique des guards du workflow, côté serveur : le front ne
 * recalcule rien, il reçoit `availableTransitions` dans les réponses tRPC.
 */
@Injectable()
export class DemarchePcaetGuardsService {
  /**
   * Résultats autoritaires des guards pour un utilisateur donné.
   * `evaluationFinaleDeposee` reste sans résultat (fail-closed) tant que les
   * évaluations ne sont pas modélisées.
   */
  computeGuardResults(
    demarche: DemarcheGuardContext,
    user: AuthenticatedUser
  ): DemarchePcaetGuardResults {
    const guardResults: DemarchePcaetGuardResults = {
      estPilote: isDemarchePcaetPilote(user.id, demarche.pilotes),
    };

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
    user: AuthenticatedUser
  ): DemarchePcaetTransition[] {
    const guardResults = this.computeGuardResults(demarche, user);
    return demarchePcaetWorkflow.getEnabledTransitions(demarche.status).filter(
      (transition) =>
        demarchePcaetWorkflow.apply(demarche.status, transition, {
          guardResults,
        }).success
    );
  }

  /** Complète un DTO avec les transitions applicables par l'utilisateur. */
  enrich(demarche: DemarchePcaet, user: AuthenticatedUser): DemarchePcaet {
    return {
      ...demarche,
      availableTransitions: this.computeAvailableTransitions(demarche, user),
    };
  }
}
