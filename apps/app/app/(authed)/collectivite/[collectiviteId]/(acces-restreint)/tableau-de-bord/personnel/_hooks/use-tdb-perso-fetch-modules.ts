import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/** Charges les différents modules du tableau de bord personnel */
export const useTdbPersoFetchModules = () => {
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  return useQuery(
    trpc.metrics.users.listModules.queryOptions({ collectiviteId })
  );
};
