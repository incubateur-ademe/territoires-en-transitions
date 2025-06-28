import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export function useGetValeursUtilisables(
  actionId: string,
  indicateurId: number
) {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const { data, ...other } = useQuery(
    trpc.referentiels.actions.getValeursUtilisables.queryOptions({
      collectiviteId,
      actionIds: [actionId],
    })
  );

  return {
    data: data?.[0]?.indicateurs.find((v) => v.indicateurId === indicateurId),
    ...other,
  };
}
