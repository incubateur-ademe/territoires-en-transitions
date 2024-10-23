import { useQuery } from 'react-query';

import { ficheActionCount } from '@tet/api/plan-actions/fiche-resumes.list';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';

export const useFicheActionCount = () => {
  const collectiviteId = useCollectiviteId();

  const { data } = useQuery(
    ['fiche_action_count', collectiviteId],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return await ficheActionCount({
        dbClient: supabaseClient,
        collectiviteId,
      });
    }
  );

  return {
    count: typeof data === 'number' ? data : 0,
  };
};
