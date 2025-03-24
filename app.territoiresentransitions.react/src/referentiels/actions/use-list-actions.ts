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
      filters: {
        actionIds: params?.actionIds, // actuellement undefined, à voir en amont pourquoi
      },
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
