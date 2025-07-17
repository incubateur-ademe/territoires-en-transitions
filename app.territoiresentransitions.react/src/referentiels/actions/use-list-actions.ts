import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';
import { TRPCClientErrorLike } from '@trpc/client';

export type ActionListFilters =
  RouterInput['referentiels']['actions']['listActions']['filters'];

export type ActionItem =
  RouterOutput['referentiels']['actions']['listActions'][number];

/**
 * TODO: why do we need to override the type
 */
export type ListActionsResponse = {
  data: ActionItem[] | undefined;
  isLoading: boolean;
  error: Error | TRPCClientErrorLike<any> | null;
};

export function useListActions(
  filters?: ActionListFilters,
  requested = true,
  externalCollectiviteId?: number
): ListActionsResponse {
  const currentCollectiviteId = useCollectiviteId();

  return trpc.referentiels.actions.listActions.useQuery(
    {
      collectiviteId: externalCollectiviteId ?? currentCollectiviteId,
      filters,
    },
    {
      enabled: requested,
    }
  );
}
