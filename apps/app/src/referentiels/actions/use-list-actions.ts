import { RouterOutput } from '@tet/api';
import {
  ActionId,
  getReferentielIdFromActionId,
  ListActionsInput,
} from '@tet/domain/referentiels';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export type ActionListItem =
  RouterOutput['referentiels']['actions']['listActionsGroupedById']['actionsById'][ActionId];

type ActionListFilters = Pick<
  ListActionsInput,
  | 'actionIds'
  | 'actionTypes'
  | 'utilisateurPiloteIds'
  | 'personnePiloteIds'
  | 'servicePiloteIds'
>;

export function useListActions(
  {
    collectiviteId,
    referentielIds = [],
    actionIds = [],
    actionTypes = [],
    utilisateurPiloteIds = [],
    personnePiloteIds = [],
    servicePiloteIds = [],
  }: ListActionsInput,
  { enabled }: { enabled?: boolean } = { enabled: true }
) {
  const referentielIdsToFetch = [
    ...new Set([
      ...referentielIds,
      ...actionIds.map(getReferentielIdFromActionId),
    ]),
  ];

  const { data: actionsMap, isPending } = useListActionsGroupedById(
    {
      referentielIds: referentielIdsToFetch,
      collectiviteId,
    },
    { enabled }
  );

  const combinedDataAcrossReferentiels = Array.from(actionsMap.values()).flatMap(
    (result) => Object.values(result.actionsById)
  );

  const data = filterActions(combinedDataAcrossReferentiels, {
    actionIds,
    actionTypes,
    utilisateurPiloteIds,
    personnePiloteIds,
    servicePiloteIds,
  });

  return {
    data,
    isPending,
  };
}

export function filterActions(
  actions: ActionListItem[],
  filters: ActionListFilters
): ActionListItem[] {
  let data = actions;
  if (filters.actionIds?.length) {
    const ids = filters.actionIds;
    data = data.filter((action) => ids.includes(action.actionId));
  }
  if (filters.actionTypes?.length) {
    const types = filters.actionTypes;
    data = data.filter((action) => types.includes(action.actionType));
  }
  if (filters.utilisateurPiloteIds?.length) {
    const ids = filters.utilisateurPiloteIds;
    data = data.filter((action) =>
      ids.every((id) => action.pilotes?.some((p) => p.userId === id))
    );
  }
  if (filters.personnePiloteIds?.length) {
    const ids = filters.personnePiloteIds;
    data = data.filter((action) =>
      ids.every((id) => action.pilotes?.some((p) => p.tagId === id))
    );
  }
  if (filters.servicePiloteIds?.length) {
    const ids = filters.servicePiloteIds;
    data = data.filter((action) =>
      ids.every((id) => action.services?.some((s) => s.id === id))
    );
  }
  return data;
}
