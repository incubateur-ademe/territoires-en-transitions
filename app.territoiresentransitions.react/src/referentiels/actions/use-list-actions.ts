import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, trpc } from '@/api/utils/trpc/client';

export type ActionListFilters =
  RouterInput['referentiels']['actions']['listActions']['filters'];

export type ActionItem =
  RouterOutput['referentiels']['actions']['listActions'][number];

export function useListActions(filters?: ActionListFilters, requested = true) {
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
