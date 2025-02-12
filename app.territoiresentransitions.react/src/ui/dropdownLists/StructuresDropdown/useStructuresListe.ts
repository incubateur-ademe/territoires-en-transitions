import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { Tag } from '@/domain/collectivites';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';

export const useStructuresListe = () => {
  const collectiviteId = useCollectiviteId()!;
  const supabase = useSupabase();

  return useQuery(['structures', collectiviteId], async () => {
    const { error, data } = await supabase
      .from('structure_tag')
      .select()
      .eq('collectivite_id', collectiviteId)
      .order('nom');

    if (error) {
      throw new Error(error.message);
    }

    return objectToCamel(data) as Tag[];
  });
};
