import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';
import { objectToCamel } from 'ts-case-convert';

export const useStructuresListe = (collectiviteIds?: number[]) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['structures', collectiviteId],

    queryFn: async () => {
      const { error, data } = await supabase
        .from('structure_tag')
        .select()
        .in('collectivite_id', collectiviteIds ?? [collectiviteId])
        .order('nom');

      if (error) {
        throw new Error(error.message);
      }

      return objectToCamel(data);
    },
  });
};
