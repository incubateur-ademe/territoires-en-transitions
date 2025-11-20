import { QueryKey, useQuery } from '@tanstack/react-query';

import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { useSupabase } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { modulesFetch } from '@tet/api/plan-actions';
import { useUser } from '@tet/api/users';

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
