import { QueryKey, useQuery } from '@tanstack/react-query';
import { useTRPCClient } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/** Charges les différents modules du tableau de bord personnel */
export const useTdbPersoFetchModules = () => {
  const trpcClient = useTRPCClient();
  const collectiviteId = useCollectiviteId();

  return useQuery({
    queryKey: getQueryKey(collectiviteId),
    queryFn: () =>
      trpcClient.collectivites.tableauDeBord.listPersonnel.query({
        collectiviteId,
      }),
  });
};

export const getQueryKey = (collectiviteId: number): QueryKey =>
  ['personal-dashboard-modules', collectiviteId] as const;
