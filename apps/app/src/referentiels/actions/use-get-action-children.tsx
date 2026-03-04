import {
  ActionId,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export function useGetActionChildren({ actionId }: { actionId: ActionId }) {
  const referentielId = getReferentielIdFromActionId(actionId);

  const [{ data: actions }] = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  if (!actions) {
    return [];
  }

  const action = actions[actionId];

  const children = action.childrenIds.map((childId) => actions[childId]);

  return children;
}
