import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { useIsScoreIndicatifEnabled } from '@/app/referentiels/comparisons/use-is-score-indicatif-enabled';

export function useGetScoreIndicatif(actionId: string) {
  const collectiviteId = useCollectiviteId();
  const isScoreIndicatifEnabled = useIsScoreIndicatifEnabled();

  return trpc.referentiels.actions.getScoreIndicatif.useQuery(
    {
      collectiviteId,
      actionIds: [actionId],
    },
    {
      enabled: isScoreIndicatifEnabled,
    }
  );
}

