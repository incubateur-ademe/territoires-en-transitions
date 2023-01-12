import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FicheActionVueRow} from './types/ficheActionVue';

type TFetchedData = {
  fiche: FicheActionVueRow;
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

  return {fiche: data[0] as FicheActionVueRow};
};

export const useFicheAction = (fiche_id: string) => {
  const {data} = useQuery(['fiche_action', fiche_id], () =>
    fetchFicheAction(fiche_id)
  );

  return data;
};
