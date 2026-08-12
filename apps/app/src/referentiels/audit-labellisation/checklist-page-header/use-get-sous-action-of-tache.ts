import { useGetAction } from '@/app/referentiels/actions/use-get-action';
import { useGetActionChildren } from '@/app/referentiels/actions/use-get-action-children';
import { useListActionsGroupedById } from '@/app/referentiels/actions/use-list-actions-grouped-by-id';
import {
  ActionId,
  getParentId,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { SousAction } from './propagate-statut-to-taches';

export const useGetSousActionOfTache = (
  tacheId: ActionId
): { sousAction: SousAction | undefined; isPending: boolean } => {
  const sousActionId = getParentId({ actionId: tacheId });
  const lookupId = sousActionId ?? tacheId;

  const { isPending } = useListActionsGroupedById({
    referentielIds: [getReferentielIdFromActionId(tacheId)],
  });
  const sousActionItem = useGetAction({ actionId: lookupId });
  const taches = useGetActionChildren({ actionId: lookupId });

  if (sousActionId === null || !sousActionItem) {
    return { sousAction: undefined, isPending };
  }

  return {
    sousAction: {
      actionId: sousActionItem.actionId,
      score: sousActionItem.score,
      actionsEnfant: taches,
    },
    isPending,
  };
};
