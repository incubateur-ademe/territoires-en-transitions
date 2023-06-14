import {useQuery} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';

export const useLabellisationParNiveau = (
  referentiel: Database['public']['Enums']['referentiel']
) => {
  const collectivite_id = useCollectiviteId()!;
  const {data} = useQuery(
    ['labellisation', collectivite_id, referentiel],
    async () => {
      const {data} = await supabaseClient
        .from('labellisation')
        .select()
        .match({collectivite_id, referentiel})
        .order('obtenue_le', {ascending: false});
      return data?.reduce(parNiveau, {}) || {};
    }
  );
  return data || {};
};

type TLabellisation = Database['public']['Tables']['labellisation']['Row'];

export type LabellisationParNiveauRead = {
  [key: number]: TLabellisation;
};

const parNiveau = (dict: LabellisationParNiveauRead, item: TLabellisation) => {
  const {etoiles} = item;
  const index = etoiles || 0; // pour gérer la valeur null
  return dict[index] ? dict : {...dict, [index]: item};
};
