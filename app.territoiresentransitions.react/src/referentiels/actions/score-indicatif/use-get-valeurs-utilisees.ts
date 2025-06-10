import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

export function useGetValeursUtilisees(
  actionId: string,
  indicateurId: number
) {
  const collectiviteId = useCollectiviteId();

  const { data, ...other } =
    trpc.referentiels.actions.getValeursUtilisees.useQuery({
      collectiviteId,
      actionIds: [actionId],
    });

  return {
    data: data?.[actionId]?.filter((v) => v.indicateurId === indicateurId),
    ...other,
  };
}
