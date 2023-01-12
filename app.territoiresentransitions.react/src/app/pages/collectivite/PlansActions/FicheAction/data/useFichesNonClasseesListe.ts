import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {TFicheAction} from './types/alias';

type TFetchedData = {
  fiches: TFicheAction[];
};

const fetchFichesNonClassees = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('fiches_action')
    .select()
    .eq('collectivite_id', collectivite_id)
    .is('axes', null)
    .order('modified_at', {ascending: false});

  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return {fiches: (data as TFicheAction[]) || []};
};

export const useFichesNonClasseesListe = (collectivite_id: number) => {
  const {data} = useQuery(['fiches_non_classees', collectivite_id], () =>
    fetchFichesNonClassees(collectivite_id)
  );

  return data;
};
