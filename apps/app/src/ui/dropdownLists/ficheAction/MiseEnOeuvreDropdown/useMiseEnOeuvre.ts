import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@tet/api';

/**
 * Charge les temps de mise en oeuvre
 */
export const useMiseEnOeuvre = () => {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['temps_de_mise_en_oeuvre'],

    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_impact_temps_de_mise_en_oeuvre')
        .select('id:niveau, nom');

      if (error) throw new Error(error.message);

      return data;
    },
  });
};
