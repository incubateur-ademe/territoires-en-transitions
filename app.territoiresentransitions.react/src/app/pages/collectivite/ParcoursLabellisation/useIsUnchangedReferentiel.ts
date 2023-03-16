import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

/** Détermine si un référentiel n'a pas encore été édité */
export const useIsUnchangedReferentiel = (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const {data} = useQuery(
    ['unchanged_referentiel', collectivite_id, referentiel],
    async () => {
      if (!collectivite_id || !referentiel) {
        return 0;
      }
      const {count} = await supabaseClient
        .from('action_statuts')
        .select('*', {head: true, count: 'exact'})
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
