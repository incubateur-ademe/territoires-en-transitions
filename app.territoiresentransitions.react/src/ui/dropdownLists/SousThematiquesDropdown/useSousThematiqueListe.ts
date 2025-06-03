import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { SousThematique } from '@/domain/shared';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';

export const useSousThematiqueListe = () => {
  const supabase = useSupabase();

  const { data, error } = useQuery(['sous_thematiques'], async () => {
    const { error, data } = await supabase.from('sous_thematique').select();

    if (error) {
      return {
        result: [],
        error,
      };
    }

    return {
      result: objectToCamel(data).map((t) => ({
        ...t,
        nom: t.sousThematique,
      })),
      error: null,
    };
  });

  if (data?.error || error) {
    throw data?.error ?? error;
  }

  return data?.result ?? ([] as SousThematique[]);
};
