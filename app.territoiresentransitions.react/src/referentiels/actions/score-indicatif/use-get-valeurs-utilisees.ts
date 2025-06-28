import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export function useGetValeursUtilisees(actionId: string, indicateurId: number) {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const { data, ...other } = useQuery(
    trpc.referentiels.actions.getValeursUtilisees.queryOptions({
      collectiviteId,
      actionIds: [actionId],
    })
  );

  return {
    data: data?.[actionId]?.filter((v) => v.indicateurId === indicateurId),
    ...other,
  };
}
