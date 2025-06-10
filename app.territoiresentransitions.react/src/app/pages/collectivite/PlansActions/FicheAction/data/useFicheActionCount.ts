import { useQuery } from 'react-query';

import { ficheActionCount } from '@/api/plan-actions/fiche-resumes.list';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';

/**
 * @deprecated Basé sur supabase donc ne doit pas être utilisé
 */
export const useFicheActionCount = () => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery(
    ['fiche_action_count', collectiviteId],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return await ficheActionCount({
        dbClient: supabase,
        collectiviteId,
      });
    }
  );

  return {
    count: typeof data === 'number' ? data : 0,
  };
};
