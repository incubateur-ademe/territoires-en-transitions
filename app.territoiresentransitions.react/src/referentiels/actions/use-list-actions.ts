import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

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
  collectiviteId?: number
): ListActionsResponse {
  const currentCollectiviteId = useCollectiviteId();

  return trpc.referentiels.actions.listActions.useQuery(
    {
      collectiviteId: collectiviteId ?? currentCollectiviteId,
      filters,
    },
    {
      enabled: requested,
    }
  );
}
