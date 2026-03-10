import { RouterOutput } from '@tet/api';
import {
  ActionId,
  getReferentielIdFromActionId,
  ListActionsInput,
} from '@tet/domain/referentiels';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export type ActionListItem =
  RouterOutput['referentiels']['actions']['listActionsGroupedById'][ActionId];

export function useListActions(
  {
    collectiviteId,
    referentielIds = [],
    actionIds = [],
    actionTypes = [],
  }: ListActionsInput,
  { enabled }: { enabled?: boolean } = { enabled: true }
) {
  const referentielIdsToFetch = [
    ...new Set([
      ...referentielIds,
      ...actionIds.map(getReferentielIdFromActionId),
    ]),
  ];

  const queryResults = useListActionsGroupedById(
    {
      referentielIds: referentielIdsToFetch,
      collectiviteId,
    },
    { enabled }
  );

  const isPending = queryResults.some((queryResult) => queryResult.isPending);

  const combinedDataAcrossReferentiels = queryResults.flatMap((queryResult) =>
    Object.values(queryResult.data ?? {})
  );

  let data = combinedDataAcrossReferentiels;
  if (actionIds.length > 0) {
    data = data.filter((action) => actionIds.includes(action.actionId));
  }
  if (actionTypes.length > 0) {
    data = data.filter((action) => actionTypes.includes(action.actionType));
  }

  return {
    data,
    isPending,
  };
}
