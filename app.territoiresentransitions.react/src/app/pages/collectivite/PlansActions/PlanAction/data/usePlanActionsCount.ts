import { useQuery } from 'react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { planActionsCount } from '@/api/plan-actions';
import { useSupabase } from '@/api/utils/supabase/use-supabase';

export const usePlanActionsCount = () => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery(
    ['plan_actions_count', collectiviteId],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return await planActionsCount({
        dbClient: supabase,
        collectiviteId,
      });
    }
  );

  return {
    count: typeof data === 'number' ? data : 0,
  };
};
