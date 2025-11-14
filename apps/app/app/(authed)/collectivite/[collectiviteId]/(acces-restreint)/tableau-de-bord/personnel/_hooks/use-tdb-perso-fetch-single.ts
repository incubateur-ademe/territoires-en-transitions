import { QueryKey, useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { moduleFetch, PersonalDefaultModuleKeys } from '@/api/plan-actions';
import { useUser } from '@/api/users';
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
