import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { useIsScoreIndicatifEnabled } from '@/app/referentiels/comparisons/use-is-score-indicatif-enabled';

export function useGetValeursUtilisees(actionId: string, indicateurId: number) {
  const collectiviteId = useCollectiviteId();
  const isScoreIndicatifEnabled = useIsScoreIndicatifEnabled();

  const { data, ...other } =
    trpc.referentiels.actions.getValeursUtilisees.useQuery(
      {
        collectiviteId,
        actionIds: [actionId],
      },
      { enabled: isScoreIndicatifEnabled }
    );

  return {
    data: data?.[actionId]?.filter((v) => v.indicateurId === indicateurId),
    ...other,
  };
}
