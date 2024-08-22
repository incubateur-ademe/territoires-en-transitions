import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FicheAction} from './types';

type TFetchedData = {
  fiche: FicheAction;
};

const fetchFicheAction = async (fiche_id: string): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('fiches_action')
    .select()
    .eq('id', fiche_id);

  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return {fiche: data[0] as FicheAction};
};

export const useFicheAction = (fiche_id: string) => {
  const {data, refetch, isLoading} = useQuery(['fiche_action', fiche_id], () =>
    fetchFicheAction(fiche_id)
  );

  return {data, refetch, isLoading};
};
