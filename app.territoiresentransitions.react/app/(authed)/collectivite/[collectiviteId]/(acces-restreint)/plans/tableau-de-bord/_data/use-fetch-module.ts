import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { CollectiviteDefaultModuleKeys } from '@/domain/collectivites';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité.
 */
export const useFetchModule = (defaultKey: CollectiviteDefaultModuleKeys) => {
  const collectiviteId = useCollectiviteId();

  return trpc.collectivites.tableauDeBord.get.useQuery({
    collectiviteId,
    defaultKey,
  });
};
