import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { SousThematique } from '@/domain/shared';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';

type TFetchedData = SousThematique[];

export const useSousThematiqueListe = () => {
  const supabase = useSupabase();

  return useQuery(['sous_thematiques'], async (): Promise<TFetchedData> => {
    const query = supabase.from('sous_thematique').select();

    const { error, data } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return objectToCamel(data).map((t) => ({
      ...t,
      nom: t.sousThematique,
    }));
  });
};
