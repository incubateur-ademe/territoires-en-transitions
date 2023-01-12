import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {TThematiqueRow} from '../types/alias';

type TFetchedData = TThematiqueRow[];

const fetchThematiqueListe = async (): Promise<TFetchedData> => {
  const query = supabaseClient.from('thematique').select();

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useThematiqueListe = () => {
  return useQuery(['thematiques'], () => fetchThematiqueListe());
};
