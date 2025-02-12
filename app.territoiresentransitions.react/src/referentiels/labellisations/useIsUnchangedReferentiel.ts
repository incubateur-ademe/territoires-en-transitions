import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

/**
 * Détermine si un référentiel n'a pas encore été édité
 * @deprecated stop using `action_statuts` PG view
 */
export const useIsUnchangedReferentiel = (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const supabase = useSupabase();
  const { data } = useQuery(
    ['unchanged_referentiel', collectivite_id, referentiel],
    async () => {
      if (!collectivite_id || !referentiel) {
        return 0;
      }
      const { count } = await supabase
        .from('action_statuts')
        .select('*', { head: true, count: 'exact' })
        .match({
          collectivite_id,
          referentiel,
          concerne: true,
          desactive: false,
        });

      return count || 0;
    }
  );
  return !data;
};
