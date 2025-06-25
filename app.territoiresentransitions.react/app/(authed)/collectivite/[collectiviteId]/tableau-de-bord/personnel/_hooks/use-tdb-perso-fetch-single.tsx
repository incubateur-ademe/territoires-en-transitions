import { moduleFetch } from '@/api/plan-actions/dashboards/personal-dashboard/actions/module.fetch';
import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { QueryKey, useQuery } from 'react-query';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export const useTdbPersoFetchSingle = (
  defaultModuleKey: PersonalDefaultModuleKeys
) => {
  const supabase = useSupabase();

  const { id: userId } = useUser();

  const collectiviteId = useCollectiviteId();

  return useQuery(getQueryKey(defaultModuleKey), async () => {
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
  });
};

export const getQueryKey = (defaultModuleKey?: string): QueryKey => [
  'personal-dashboard-module',
  defaultModuleKey,
];
