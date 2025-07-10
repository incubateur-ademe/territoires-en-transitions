import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { useIsScoreIndicatifEnabled } from '@/app/referentiels/comparisons/use-is-score-indicatif-enabled';

export function useGetValeursUtilisables(
  actionId: string,
  indicateurId: number
) {
  const collectiviteId = useCollectiviteId();
  const isScoreIndicatifEnabled = useIsScoreIndicatifEnabled();

  const { data, ...other } =
    trpc.referentiels.actions.getValeursUtilisables.useQuery(
      {
        collectiviteId,
        actionIds: [actionId],
      },
      { enabled: isScoreIndicatifEnabled }
    );

  return {
    data: data?.[0]?.indicateurs.find((v) => v.indicateurId === indicateurId),
    ...other,
  };
}
