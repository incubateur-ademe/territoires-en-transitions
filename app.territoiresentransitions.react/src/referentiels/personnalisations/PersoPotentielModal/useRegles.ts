import { Tables } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';

export type TPersonnalisationRegleRead = Tables<'personnalisation_regle'>;

type TUseRegles = (action_id: string) => TPersonnalisationRegleRead[];

// charge les règles de personnalisation pour une action donnée
export const useRegles: TUseRegles = (action_id) => {
  const supabase = useSupabase();
  const query = useQuery({
    queryKey: ['personnalisation_regle', action_id],

    queryFn: async () => {
      const { data } = await supabase
        .from('personnalisation_regle')
        .select()
        .match({ action_id });
      return data;
    },
  });

  return query?.data || [];
};
