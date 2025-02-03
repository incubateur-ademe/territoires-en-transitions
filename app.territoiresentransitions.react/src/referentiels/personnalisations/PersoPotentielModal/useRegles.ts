import { Tables } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useQuery } from 'react-query';

export type TPersonnalisationRegleRead = Tables<'personnalisation_regle'>;

type TUseRegles = (action_id: string) => TPersonnalisationRegleRead[];

// charge les règles de personnalisation pour une action donnée
export const useRegles: TUseRegles = (action_id) => {
  const query = useQuery(['personnalisation_regle', action_id], async () => {
    const { data } = await supabaseClient
      .from('personnalisation_regle')
      .select()
      .match({ action_id });
    return data;
  });

  return query?.data || [];
};
