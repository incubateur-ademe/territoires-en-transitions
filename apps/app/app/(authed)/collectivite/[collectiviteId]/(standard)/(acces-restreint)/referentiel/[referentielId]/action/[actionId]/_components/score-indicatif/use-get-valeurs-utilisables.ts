import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

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
