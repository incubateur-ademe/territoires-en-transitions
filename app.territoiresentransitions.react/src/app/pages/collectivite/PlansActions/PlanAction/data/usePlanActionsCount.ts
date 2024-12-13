import { useQuery } from 'react-query';

import { planActionsCount } from '@/api/plan-actions';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';

export const usePlanActionsCount = () => {
  const collectiviteId = useCollectiviteId();

  const { data } = useQuery(
    ['plan_actions_count', collectiviteId],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return await planActionsCount({
        dbClient: supabaseClient,
        collectiviteId,
      });
    }
  );

  return {
    count: typeof data === 'number' ? data : 0,
  };
};
