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

  const [{ data: actions }] = useListActionsGroupedById({
    referentielIds: [referentielId],
    collectiviteId: externalCollectiviteId,
  });

  if (!actions) {
    return;
  }

  const action = actions[actionId];
  return action;
}
