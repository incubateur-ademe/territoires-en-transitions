import { QueryKey, useQuery } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { moduleFetch } from '@/api/plan-actions/dashboards/personal-dashboard/actions/module.fetch';
import { PersonalDefaultModuleKeys } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useUser } from '@/api/users/user-context/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export const useTdbPersoFetchSingle = (
  defaultModuleKey: PersonalDefaultModuleKeys
) => {
  const supabase = useSupabase();

  const { id: userId } = useUser();

  const collectiviteId = useCollectiviteId();

  const { plans } = useListPlans(collectiviteId);
  const planIds = plans.map((plan) => plan.id);

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
        planIds,
      });
    },
  });
};

export const getQueryKey = (defaultModuleKey?: string): QueryKey => [
  'personal-dashboard-module',
  defaultModuleKey,
];
