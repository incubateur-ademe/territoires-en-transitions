import { moduleFetch } from '@/api/plan-actions/dashboards/personal-dashboard/actions/module.fetch';
import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useAuth } from '@/app/core-logic/api/auth/AuthProvider';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { QueryKey, useQuery } from 'react-query';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export const usePersonalModuleFetch = (defaultModuleKey: PersonalDefaultModuleKeys) => {
  const collectiviteId = useCollectiviteId();
  const userId = useAuth().user?.id;

  return useQuery(getQueryKey(defaultModuleKey), async () => {
    if (!collectiviteId) {
      throw new Error('Aucune collectivité associée');
    }

    if (!userId) {
      throw new Error('Aucun utilisateur connecté');
    }

    return await moduleFetch({
      dbClient: supabaseClient,
      collectiviteId,
      userId,
      defaultModuleKey,
    });
  });
};

export const getQueryKey = (defaultModuleKey?: PersonalDefaultModuleKeys): QueryKey => [
  'personal-dashboard-module',
  defaultModuleKey,
];
