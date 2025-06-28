import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export function useGetScoreIndicatif(actionId: string) {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.actions.getScoreIndicatif.queryOptions({
      collectiviteId,
      actionIds: [actionId],
    })
  );
}
