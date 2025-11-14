import { useTRPC } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useIsScoreIndicatifEnabled } from '@/app/referentiels/comparisons/use-is-score-indicatif-enabled';
import { useQuery } from '@tanstack/react-query';

export function useGetValeursUtilisables(
  actionId: string,
  indicateurId: number
) {
  const collectiviteId = useCollectiviteId();
  const isScoreIndicatifEnabled = useIsScoreIndicatifEnabled();
  const trpc = useTRPC();

  const { data, ...other } = useQuery(
    trpc.referentiels.actions.getValeursUtilisables.queryOptions(
      {
        collectiviteId,
        actionIds: [actionId],
      },
      { enabled: isScoreIndicatifEnabled }
    )
  );

  return {
    data: data?.[0]?.indicateurs.find((v) => v.indicateurId === indicateurId),
    ...other,
  };
}
