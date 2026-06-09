import {
  ActionId,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export function useGetActionChildren({ actionId }: { actionId: ActionId }) {
  const referentielId = getReferentielIdFromActionId(actionId);

  const { data } = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  const actions = data.get(referentielId);
  if (!actions) {
    return [];
  }
  const actionsById = actions.actionsById;
  const action = actionsById[actionId];
  if (!action) {
    return [];
  }

  const children = action.childrenIds.flatMap((childId) => {
    const child = actionsById[childId];
    return child ? [child] : [];
  });

  return children;
}
