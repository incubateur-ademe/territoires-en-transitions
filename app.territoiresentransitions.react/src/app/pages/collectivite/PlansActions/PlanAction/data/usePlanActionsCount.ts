import { useQuery } from 'react-query';

import { planActionsCount } from '@/api/plan-actions';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';

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
