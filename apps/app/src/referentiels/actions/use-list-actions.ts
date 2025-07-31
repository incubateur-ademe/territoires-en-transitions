import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export type ActionListFilters =
  RouterInput['referentiels']['actions']['listActions']['filters'];

export type ActionItem =
  RouterOutput['referentiels']['actions']['listActions'][number];

export type ListActionsResponse = {
  data: ActionItem[] | undefined;
  isLoading: boolean;
};

export function useListActions(
  filters?: ActionListFilters,
  requested = true,
  externalCollectiviteId?: number
): ListActionsResponse {
  const currentCollectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.actions.listActions.queryOptions(
      {
        collectiviteId: externalCollectiviteId ?? currentCollectiviteId,
        filters,
      },
      {
        enabled: requested,
      }
    )
  );
}
