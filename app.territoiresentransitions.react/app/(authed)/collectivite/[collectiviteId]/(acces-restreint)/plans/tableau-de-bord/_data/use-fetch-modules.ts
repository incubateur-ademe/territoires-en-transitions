import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

/** Charge les différents modules du tableau de bord collectivité */
export const useFetchModules = () => {
  const collectiviteId = useCollectiviteId();

  return trpc.collectivites.tableauDeBord.list.useQuery({
    collectiviteId,
  });
};
