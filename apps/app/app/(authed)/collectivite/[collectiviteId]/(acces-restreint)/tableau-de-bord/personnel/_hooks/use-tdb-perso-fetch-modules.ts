import { QueryKey, useQuery } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { modulesFetch } from '@/api/plan-actions/dashboards/personal-dashboard';
import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';

/** Charges les différents modules du tableau de bord personnel */
export const useTdbPersoFetchModules = () => {
  const supabase = useSupabase();

  const { id: userId } = useUser();

  const collectiviteId = useCollectiviteId();

  const { plans } = useListPlans(collectiviteId);
  const planIds = plans.map((plan) => plan.id);

  return useQuery({
    queryKey: getQueryKey(collectiviteId),
    queryFn: async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      if (!userId) {
        throw new Error('Aucun utilisateur connecté');
      }

      const { data, error } = await modulesFetch({
        dbClient: supabase,
        collectiviteId,
        userId,
        planIds,
      });

      if (error) {
        throw error;
      }

      return data;
    },
  });
};

export const getQueryKey = (collectiviteId: number): QueryKey =>
  ['personal-dashboard-modules', collectiviteId] as const;
