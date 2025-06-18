import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

/** Charge les différents modules du tableau de bord personnel */
export const useCollectiviteModulesFetch = () => {
  const collectiviteId = useCollectiviteId();

  return trpc.collectivites.tableauDeBord.list.useQuery({
    collectiviteId,
  });
};
