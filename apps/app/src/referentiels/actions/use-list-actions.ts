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
  { actionIds = [], referentielIds = [], collectiviteId }: ListActionsInput,
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

  const data =
    actionIds.length > 0
      ? combinedDataAcrossReferentiels.filter((action) =>
          actionIds.includes(action.actionId)
        )
      : combinedDataAcrossReferentiels;

  return {
    data,
    isPending,
  };
}
