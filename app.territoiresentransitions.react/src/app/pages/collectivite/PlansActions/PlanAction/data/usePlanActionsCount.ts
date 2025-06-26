import { useQuery } from '@tanstack/react-query';

import { useCurrentCollectivite } from '@/api/collectivites';
import { planActionsCount } from '@/api/plan-actions';
import { useSupabase } from '@/api/utils/supabase/use-supabase';

export const usePlanActionsCount = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const supabase = useSupabase();

  const { data } = useQuery({
    queryKey: ['plan_actions_count', collectiviteId],

    queryFn: async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return await planActionsCount({
        dbClient: supabase,
        collectiviteId,
      });
    },
  });

  return {
    count: typeof data === 'number' ? data : 0,
  };
};
