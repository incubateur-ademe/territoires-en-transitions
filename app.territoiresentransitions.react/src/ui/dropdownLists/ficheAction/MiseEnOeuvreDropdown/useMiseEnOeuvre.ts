import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

/**
 * Charge les temps de mise en oeuvre
 */
export const useMiseEnOeuvre = () => {
  const supabase = useSupabase();
  return useQuery(['temps_de_mise_en_oeuvre'], async () => {
    const { data, error } = await supabase
      .from('action_impact_temps_de_mise_en_oeuvre')
      .select('id:niveau, nom');

    if (error) throw new Error(error.message);

    return data;
  });
};
