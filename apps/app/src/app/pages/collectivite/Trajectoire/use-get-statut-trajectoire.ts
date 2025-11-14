import { useTRPC } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useQuery } from '@tanstack/react-query';

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
