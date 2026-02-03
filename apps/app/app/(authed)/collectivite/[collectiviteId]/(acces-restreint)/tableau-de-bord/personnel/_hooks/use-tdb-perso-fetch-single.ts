import { QueryKey, useQuery } from '@tanstack/react-query';

import { useSupabase } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { moduleFetch, PersonalDefaultModuleKeys } from '@tet/api/plan-actions';
import { useUser } from '@tet/api/users';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export const useTdbPersoFetchSingle = (
  defaultModuleKey: PersonalDefaultModuleKeys
) => {
  const supabase = useSupabase();

  const { id: userId } = useUser();

  const collectiviteId = useCollectiviteId();

  return useQuery({
    queryKey: getQueryKey(defaultModuleKey),
    queryFn: async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      if (!userId) {
        throw new Error('Aucun utilisateur connecté');
      }

      return await moduleFetch({
        dbClient: supabase,
        collectiviteId,
        userId,
        defaultModuleKey,
      });
    },
  });
};

export const getQueryKey = (defaultModuleKey?: string): QueryKey => [
  'personal-dashboard-module',
  defaultModuleKey,
];
