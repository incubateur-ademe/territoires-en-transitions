import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export const useGetStatutTrajectoire = (enabled = true) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.trajectoires.snbc.checkStatus.queryOptions(
      {
        collectiviteId,
      },
      {
        enabled: enabled && !!collectiviteId,
      }
    )
  );
};
