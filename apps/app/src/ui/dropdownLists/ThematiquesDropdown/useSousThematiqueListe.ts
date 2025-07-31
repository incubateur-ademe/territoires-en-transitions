import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { SousThematique } from '@/domain/shared';
import { useQuery } from '@tanstack/react-query';
import { objectToCamel } from 'ts-case-convert';

export const useSousThematiqueListe = (): SousThematique[] => {
  const supabase = useSupabase();

  const { data, error } = useQuery({
    queryKey: ['sous_thematiques'],

    queryFn: async () => {
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
    },
  });

  if (data?.error || error) {
    throw data?.error ?? error;
  }

  return data?.result ?? ([] as SousThematique[]);
};
