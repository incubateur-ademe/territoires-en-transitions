import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export function useGetScoreIndicatif({
  actionIds,
  enabled = true,
}: {
  actionIds: string[];
  enabled: boolean;
}) {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.actions.getScoreIndicatif.queryOptions(
      {
        collectiviteId,
        actionIds,
      },
      {
        enabled: enabled && actionIds.length > 0,
      }
    )
  );
}
