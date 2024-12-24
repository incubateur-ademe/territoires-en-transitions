import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { Tag } from '@/domain/collectivites';
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
