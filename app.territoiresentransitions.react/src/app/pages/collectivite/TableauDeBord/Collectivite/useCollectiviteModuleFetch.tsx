import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { CollectiviteDefaultModuleKeys } from '@/domain/collectivites';
import { QueryKey } from 'react-query';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité.
 */
export const useCollectiviteModuleFetch = (
  defaultModuleKey: CollectiviteDefaultModuleKeys
) => {
  const collectiviteId = useCollectiviteId();

  return trpc.collectivites.tableauDeBord.get.useQuery({
    collectiviteId,
    defaultKey: defaultModuleKey,
  });
};

export const getQueryKey = (
  defaultModuleKey?: CollectiviteDefaultModuleKeys
): QueryKey => ['collectivite-dashboard-module', defaultModuleKey];
