import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

export type Action =
  RouterOutput['referentiels']['actions']['listActions'][number];

export type ActionListFilters =
  RouterInput['referentiels']['actions']['listActions']['filters'];

export function useListActions(filters?: ActionListFilters) {
  const collectiviteId = useCollectiviteId();

  return trpc.referentiels.actions.listActions.useQuery({
    collectiviteId,
    filters,
  });
}

export function useListActionsWithScores(filters?: ActionListFilters) {
  const collectiviteId = useCollectiviteId();

  return trpc.referentiels.actions.listActionsWithScores.useQuery({
    collectiviteId,
    filters,
  });
}
