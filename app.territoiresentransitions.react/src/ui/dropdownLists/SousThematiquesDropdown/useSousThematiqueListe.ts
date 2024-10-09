import { useQuery } from 'react-query';

import { SousThematiqueId } from '@tet/api/shared/domain';
import { supabaseClient } from 'core-logic/api/supabase';
import { objectToCamel } from 'ts-case-convert';

type TFetchedData = SousThematiqueId[];

const fetchSousThematiqueListe = async (): Promise<TFetchedData> => {
  const query = supabaseClient.from('sous_thematique').select();

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return objectToCamel(data);
};

export const useSousThematiqueListe = () => {
  return useQuery(['sous_thematiques'], () => fetchSousThematiqueListe());
};
