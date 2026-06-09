import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export function useGetAction({
  actionId,
  externalCollectiviteId,
}: {
  actionId: string;
  externalCollectiviteId?: number;
}) {
  const referentielId = getReferentielIdFromActionId(actionId);

  const { data } = useListActionsGroupedById({
    referentielIds: [referentielId],
    collectiviteId: externalCollectiviteId,
  });

  const actions = data.get(referentielId);
  if (!actions) {
    return;
  }

  const action = actions.actionsById[actionId];
  return action;
}
