import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';

export type TPersonnalisationRegleRead =
  Database['public']['Tables']['personnalisation_regle']['Row'];

type TUseRegles = (action_id: string) => TPersonnalisationRegleRead[];

// charge les règles de personnalisation pour une action donnée
export const useRegles: TUseRegles = action_id => {
  const query = useQuery(['personnalisation_regle', action_id], async () => {
    const {data} = await supabaseClient
      .from('personnalisation_regle')
      .select()
      .match({action_id});
    return data;
  });

  return query?.data || [];
};
