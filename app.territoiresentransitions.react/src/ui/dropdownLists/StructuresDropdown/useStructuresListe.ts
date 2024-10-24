import { Tag } from '@tet/api/shared/domain';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';

export const useStructuresListe = () => {
  const collectiviteId = useCollectiviteId()!;

  return useQuery(['structures', collectiviteId], async () => {
    const { error, data } = await supabaseClient
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
