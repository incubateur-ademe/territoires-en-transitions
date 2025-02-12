import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

export const useThematiqueListe = () => {
  const supabase = useSupabase();

  return useQuery(['thematiques'], async () => {
    const { error, data } = await supabase.from('thematique').select();

    if (error) {
      throw new Error(error.message);
    }

    return (
      data
        // tri par nom (avec prise en compte des diacritiques)
        ?.sort((a, b) => a.nom.localeCompare(b.nom))
    );
  });
};
