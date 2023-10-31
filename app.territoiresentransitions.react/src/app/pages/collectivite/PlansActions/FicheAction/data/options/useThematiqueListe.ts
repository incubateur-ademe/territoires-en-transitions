import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

const fetchThematiqueListe = async () => {
  const {error, data} = await supabaseClient.from('thematique').select();

  if (error) {
    throw new Error(error.message);
  }

  return (
    data
      // tri par nom (avec prise en compte des diacritiques)
      ?.sort((a, b) => a.nom.localeCompare(b.nom))
  );
};

export const useThematiqueListe = () => {
  return useQuery(['thematiques'], () => fetchThematiqueListe());
};
