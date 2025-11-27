import { useQuery } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { ficheActionCount } from '@/api/plan-actions/fiche-resumes.list';
import { useSupabase } from '@/api/utils/supabase/use-supabase';

/**
 * @deprecated Basé sur supabase donc ne doit pas être utilisé
 */
export const useGetFichesTotalCount = () => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery({
    queryKey: ['fiche_action_count', collectiviteId],

    queryFn: async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return await ficheActionCount({
        dbClient: supabase,
        collectiviteId,
      });
    },
  });

  return {
    count: typeof data === 'number' ? data : 0,
  };
};
