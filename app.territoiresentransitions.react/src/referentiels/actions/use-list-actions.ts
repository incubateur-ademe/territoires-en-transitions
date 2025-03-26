import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

export type Action =
  RouterOutput['referentiels']['actions']['listActions'][number];

export type ActionListFilters =
  RouterInput['referentiels']['actions']['listActions']['filters'];

export function useListActions(filters?: ActionListFilters) {
  const collectiviteId = useCollectiviteId();

  return trpc.referentiels.actions.listActions.useQuery(
    {
      collectiviteId,
      filters,
    },
    DISABLE_AUTO_REFETCH
  );
}

export type ActionWithStatut =
  RouterOutput['referentiels']['actions']['listActionsWithStatuts'][number];

export function useListActionsWithStatuts(
  {
    actionIds,
  }: {
    actionIds?: string[];
  },
  requested = true
) {
  const collectiviteId = useCollectiviteId();
  return trpc.referentiels.actions.listActionsWithStatuts.useQuery(
    {
      collectiviteId,
      actionIds,
    },
    { ...DISABLE_AUTO_REFETCH, enabled: requested }
  );
}
