import { Tag } from '@tet/api/shared/domain';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';

export const usePartenairesListe = () => {
  const collectiviteId = useCollectiviteId()!;

  return useQuery(['partenaires', collectiviteId], async () => {
    const { error, data } = await supabaseClient
      .from('partenaire_tag')
      .select()
      .eq('collectivite_id', collectiviteId)
      .order('nom');

    if (error) {
      throw new Error(error.message);
    }

    return objectToCamel(data) as Tag[];
  });
};
