import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

export type ActionListFilters =
  RouterInput['referentiels']['actions']['listActions']['filters'];

export type ActionItem =
  RouterOutput['referentiels']['actions']['listActions'][number];

export type ListActionsResponse = { data: ActionItem[] | undefined };

export function useListActions(filters?: ActionListFilters, requested = true): ListActionsResponse {
  const collectiviteId = useCollectiviteId();

  return trpc.referentiels.actions.listActions.useQuery(
    {
      collectiviteId,
      filters,
    },
    {
      enabled: requested,
    }
  );
}
