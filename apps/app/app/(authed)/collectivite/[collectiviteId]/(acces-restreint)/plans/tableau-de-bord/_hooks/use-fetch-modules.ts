import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/** Charge les différents modules du tableau de bord collectivité */
export const useFetchModules = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.tableauDeBord.list.queryOptions({
      collectiviteId,
    })
  );
};
