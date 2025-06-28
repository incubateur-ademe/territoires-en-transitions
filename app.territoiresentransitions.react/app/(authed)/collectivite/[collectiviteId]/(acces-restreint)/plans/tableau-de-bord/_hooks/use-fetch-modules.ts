import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

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
