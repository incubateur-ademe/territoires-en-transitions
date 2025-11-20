import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@tet/api';
import { Thematique } from '@tet/domain/shared';

export const useThematiqueListe = (): Thematique[] => {
  const supabase = useSupabase();

  const { data, error } = useQuery({
    queryKey: ['thematiques'],

    queryFn: async () => {
      const { error, data } = await supabase.from('thematique').select();

      if (error) {
        return {
          error,
          result: null,
        };
      }

      return {
        result: data?.sort((a, b) => a.nom.localeCompare(b.nom)),
        error: null,
      };
    },
  });

  if (data?.error || error) {
    throw data?.error ?? error;
  }

  return data?.result ?? ([] as Thematique[]);
};
