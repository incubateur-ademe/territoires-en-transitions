import { useQuery } from 'react-query';

import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { planActionsCount } from '@tet/api/plan-actions';

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
