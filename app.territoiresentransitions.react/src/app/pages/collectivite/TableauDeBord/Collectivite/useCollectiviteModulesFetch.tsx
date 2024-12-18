import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';

/** Charge les différents modules du tableau de bord personnel */
export const useCollectiviteModulesFetch = () => {
  const collectiviteId = useCollectiviteId();

  return trpc.collectivites.tableauDeBord.list.useQuery({
    collectiviteId: collectiviteId!,
  });
};
