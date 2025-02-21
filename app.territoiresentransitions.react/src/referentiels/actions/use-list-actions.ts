import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { RouterOutput, trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

export type Action =
  RouterOutput['referentiels']['actions']['listActions'][number];

export function useListActions(params?: { actionIds?: string[] }) {
  const collectiviteId = useCollectiviteId();
  return trpc.referentiels.actions.listActions.useQuery(
    {
      collectiviteId,
      actionIds: params?.actionIds,
    },
    DISABLE_AUTO_REFETCH
  );
}

export type ActionWithStatut =
  RouterOutput['referentiels']['actions']['listActionsWithStatuts'][number];

export function useListActionsWithStatuts({
  actionIds,
}: {
  actionIds?: string[];
}) {
  const collectiviteId = useCollectiviteId();
  return trpc.referentiels.actions.listActionsWithStatuts.useQuery(
    {
      collectiviteId,
      actionIds,
    },
    DISABLE_AUTO_REFETCH
  );
}
