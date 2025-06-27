import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

export function useGetScoreIndicatif(actionId: string) {
  const collectiviteId = useCollectiviteId();

  return trpc.referentiels.actions.getScoreIndicatif.useQuery(
    {
      collectiviteId,
      actionIds: [actionId],
    }
  );
}

