import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TPartenaireRow} from 'types/alias';

export const usePartenairesListe = () => {
  const collectivite_id = useCollectiviteId()!;

  return useQuery(['partenaires', collectivite_id], async () => {
    const {error, data} = await supabaseClient
      .from('partenaire_tag')
      .select()
      .eq('collectivite_id', collectivite_id)
      .order('nom');

    if (error) throw new Error(error.message);

    return data as TPartenaireRow[];
  });
};
