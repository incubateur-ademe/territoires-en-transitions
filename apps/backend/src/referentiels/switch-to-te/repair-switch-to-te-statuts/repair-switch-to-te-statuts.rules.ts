import { type ActionStatutsByActionId } from '@tet/backend/referentiels/compute-score/action-statuts-by-action-id.dto';
import {
  actionStatutCreateToActionStatutInDatabase,
  inferStatutDetailleAuPourcentageFromStatut,
} from '@tet/backend/referentiels/update-action-statut/action-statut-create-to-action-statut-in-database.adapter';
import {
  StatutAvancementEnum,
  type ActionScore,
  type ActionStatutCreate,
} from '@tet/domain/referentiels';

/**
 * Décision pour un statut TE « Non concerné » resté intact depuis la bascule :
 * - `update` : la bascule corrigée écrirait ce statut ;
 * - `delete` : la bascule corrigée n'écrirait aucune ligne (tâche, sous-mesure
 *   porteuse de tâches, `exprScore`) ;
 * - `keep` : la bascule corrigée écrirait aussi « Non concerné » (toutes les
 *   origines sont non concernées).
 */
export type RepairStatutDecision =
  | { actionId: string; decision: 'update'; statut: ActionStatutCreate }
  | { actionId: string; decision: 'delete' }
  | { actionId: string; decision: 'keep' };

export type RepairStatutsDecisions = {
  decisions: RepairStatutDecision[];
  /**
   * NC intacts sur des actions actives à la bascule : hors du bug (la
   * désactivation n'y est pour rien), jamais modifiés.
   */
  ignoredActionIds: string[];
};

/**
 * Compare les statuts « Non concerné » intacts aux statuts qu'écrirait la
 * bascule corrigée. Seules les actions désactivées au moment de la bascule
 * (snapshot `post-switch-te`) sont traitées.
 */
export const decideRepairStatuts = ({
  intactNonConcerneActionIds,
  expectedStatuts,
  postSwitchScoreMap,
}: {
  intactNonConcerneActionIds: string[];
  expectedStatuts: ActionStatutCreate[];
  postSwitchScoreMap: Map<string, ActionScore>;
}): RepairStatutsDecisions => {
  const expectedByActionId = new Map(
    expectedStatuts.map((statut) => [statut.actionId, statut])
  );
  const decisions: RepairStatutDecision[] = [];
  const ignoredActionIds: string[] = [];

  for (const actionId of intactNonConcerneActionIds) {
    if (postSwitchScoreMap.get(actionId)?.desactive !== true) {
      ignoredActionIds.push(actionId);
      continue;
    }

    const expected = expectedByActionId.get(actionId);
    if (!expected) {
      decisions.push({ actionId, decision: 'delete' });
    } else if (expected.statut === StatutAvancementEnum.NON_CONCERNE) {
      decisions.push({ actionId, decision: 'keep' });
    } else {
      decisions.push({ actionId, decision: 'update', statut: expected });
    }
  }

  return { decisions, ignoredActionIds };
};

/**
 * Applique les décisions aux statuts lus en base, sans rien écrire : sert à
 * simuler le score après rattrapage (dry-run). L'avancement détaillé est
 * complété comme le fait `ListActionStatutsRepository`.
 */
export const applyRepairDecisionsToActionStatuts = (
  actionStatuts: ActionStatutsByActionId,
  decisions: RepairStatutDecision[]
): ActionStatutsByActionId => {
  const patched = { ...actionStatuts };

  for (const decision of decisions) {
    if (decision.decision === 'delete') {
      delete patched[decision.actionId];
    } else if (decision.decision === 'update') {
      const values = actionStatutCreateToActionStatutInDatabase(
        decision.statut
      );
      patched[decision.actionId] = {
        ...patched[decision.actionId],
        ...values,
        avancementDetaille:
          values.avancement === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE
            ? values.avancementDetaille
            : inferStatutDetailleAuPourcentageFromStatut(values.avancement),
      };
    }
  }

  return patched;
};
