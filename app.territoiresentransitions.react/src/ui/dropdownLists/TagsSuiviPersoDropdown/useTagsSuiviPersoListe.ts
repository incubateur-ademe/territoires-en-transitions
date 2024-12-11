import { Tag } from '@/api/shared/domain';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';

export const useTagsSuiviPersoListe = () => {
  const collectiviteId = useCollectiviteId()!;

  return useQuery(['tags_suivi_perso', collectiviteId], async () => {
    const { error, data } = await supabaseClient
      .from('libre_tag')
      .select()
      .eq('collectivite_id', collectiviteId)
      .order('nom');

    if (error) {
      throw new Error(error.message);
    }

    return objectToCamel(data) as Tag[];
  });
};
