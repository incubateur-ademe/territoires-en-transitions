import { useIsScoreIndicatifEnabled } from '@/app/referentiels/comparisons/use-is-score-indicatif-enabled';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export function useGetScoreIndicatif(actionId: string) {
  const collectiviteId = useCollectiviteId();
  const isScoreIndicatifEnabled = useIsScoreIndicatifEnabled();
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.actions.getScoreIndicatif.queryOptions(
      {
        collectiviteId,
        actionIds: [actionId],
      },
      {
        enabled: isScoreIndicatifEnabled,
      }
    )
  );
}
