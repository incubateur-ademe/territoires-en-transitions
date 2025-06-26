import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { Tag } from '@/domain/collectivites';
import { useQuery } from '@tanstack/react-query';
import { objectToCamel } from 'ts-case-convert';

export const useServicesPilotesListe = (collectiviteIds?: number[]) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  // TODO: utilisation d'un service backend
  return useQuery({
    queryKey: ['services_pilotes', collectiviteId],

    queryFn: async () => {
      const { error, data } = await supabase
        .from('service_tag')
        .select()
        .in('collectivite_id', collectiviteIds || [collectiviteId])
        .order('nom');

      if (error) throw new Error(error.message);

      return objectToCamel(data) as Tag[];
    },
  });
};
