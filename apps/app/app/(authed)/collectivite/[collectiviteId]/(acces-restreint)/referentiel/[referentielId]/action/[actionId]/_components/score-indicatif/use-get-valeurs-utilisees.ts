import { useIsScoreIndicatifEnabled } from '@/app/referentiels/comparisons/use-is-score-indicatif-enabled';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export function useGetValeursUtilisees(actionId: string, indicateurId: number) {
  const collectiviteId = useCollectiviteId();
  const isScoreIndicatifEnabled = useIsScoreIndicatifEnabled();
  const trpc = useTRPC();

  const { data, ...other } = useQuery(
    trpc.referentiels.actions.getValeursUtilisees.queryOptions(
      {
        collectiviteId,
        actionIds: [actionId],
      },
      { enabled: isScoreIndicatifEnabled }
    )
  );

  return {
    data: data?.[actionId]?.filter((v) => v.indicateurId === indicateurId),
    ...other,
  };
}
