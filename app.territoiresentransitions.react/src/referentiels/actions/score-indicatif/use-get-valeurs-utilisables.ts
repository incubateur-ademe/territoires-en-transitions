import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

export function useGetValeursUtilisables(
  actionId: string,
  indicateurId: number
) {
  const collectiviteId = useCollectiviteId();

  const { data, ...other } =
    trpc.referentiels.actions.getValeursUtilisables.useQuery({
      collectiviteId,
      actionIds: [actionId],
    });

  return {
    data: data?.[0]?.indicateurs.find((v) => v.indicateurId === indicateurId),
    ...other,
  };
}
