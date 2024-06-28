import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {TSousThematiqueRow} from 'types/alias';

type TFetchedData = TSousThematiqueRow[];

const fetchSousThematiqueListe = async (): Promise<TFetchedData> => {
  const query = supabaseClient.from('sous_thematique').select();

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useSousThematiqueListe = () => {
  return useQuery(['sous_thematiques'], () => fetchSousThematiqueListe());
};
