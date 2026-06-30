import { QueryKey, useQuery } from '@tanstack/react-query';
import { useTRPCClient } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { PersonalDefaultModuleKeys } from '@tet/api/plan-actions';

/**
 * Fetch un module spécifique du tableau de bord personnel de l'utilisateur courant.
 */
export const useTdbPersoFetchSingle = (
  defaultModuleKey: PersonalDefaultModuleKeys
) => {
  const trpcClient = useTRPCClient();
  const collectiviteId = useCollectiviteId();

  return useQuery({
    queryKey: getQueryKey(defaultModuleKey),
    queryFn: () =>
      trpcClient.metrics.users.getModule.query({
        collectiviteId,
        defaultKey: defaultModuleKey,
      }),
  });
};

export const getQueryKey = (defaultModuleKey?: string): QueryKey => [
  'personal-dashboard-module',
  defaultModuleKey,
];
