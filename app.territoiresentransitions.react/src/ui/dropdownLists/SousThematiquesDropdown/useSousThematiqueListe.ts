import { supabaseClient } from '@/app/core-logic/api/supabase';
import { SousThematique } from '@/domain/shared';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';

type TFetchedData = SousThematique[];

const fetchSousThematiqueListe = async (): Promise<TFetchedData> => {
  const query = supabaseClient.from('sous_thematique').select();

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return objectToCamel(data).map((t) => ({
    ...t,
    nom: t.sousThematique,
  }));
};

export const useSousThematiqueListe = () => {
  return useQuery(['sous_thematiques'], () => fetchSousThematiqueListe());
};
