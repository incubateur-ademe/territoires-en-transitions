import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FicheResume} from './types';

type TFetchedData = {
  fiches: FicheResume[];
  count: number | null;
};

const fetchFichesNonClassees = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('fiche_resume')
    .select('*', {count: 'exact'})
    .eq('collectivite_id', collectivite_id)
    .is('plans', null)
    .order('modified_at', {ascending: false});

  const {error, data, count} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {fiches: (data as FicheResume[]) || [], count};
};

export const useFichesNonClasseesListe = (collectivite_id: number) => {
  const {data} = useQuery(['fiches_non_classees', collectivite_id], () =>
    fetchFichesNonClassees(collectivite_id)
  );

  return data;
};
