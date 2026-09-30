import { ActionTypeEnum, StatutAvancementEnum } from '@tet/domain/referentiels';
import { ActionListItem } from '../actions/use-list-actions';

/**
 * Retire les flags "détaillé à la tâche en attente" devenus inutiles : la ligne
 * a disparu, n'est plus une sous-action, ou l'inférence backend affiche enfin
 * "détaillé à la tâche".
 *
 * Renvoie `pendingByActionId` tel quel quand rien n'est retiré.
 */
export const removeStalePendingDetailleALaTache = (
  pendingByActionId: Record<string, boolean>,
  actions: Record<string, ActionListItem>
): Record<string, boolean> => {
  const next = { ...pendingByActionId };
  let hasChanged = false;

  for (const actionId in pendingByActionId) {
    if (!pendingByActionId[actionId]) continue;
    const action = actions[actionId];

    if (
      !action ||
      action.actionType !== ActionTypeEnum.SOUS_ACTION ||
      action.score.statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE
    ) {
      delete next[actionId];
      hasChanged = true;
    }
  }

  return hasChanged ? next : pendingByActionId;
};
