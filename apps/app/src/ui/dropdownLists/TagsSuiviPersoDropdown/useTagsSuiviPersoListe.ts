import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TagWithCollectiviteId } from '@/domain/collectivites';
import { useQuery } from '@tanstack/react-query';
import { objectToCamel } from 'ts-case-convert';

export const useTagsSuiviPersoListe = (collectiviteIds?: number[]) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['tags_suivi_perso', collectiviteId],
    queryFn: async () => {
      const { error, data } = await supabase
        .from('libre_tag')
        .select()
        .in('collectivite_id', collectiviteIds ?? [collectiviteId])
        .order('nom');

      if (error) {
        throw new Error(error.message);
      }

      return objectToCamel(data) as TagWithCollectiviteId[];
    },
  });
};
