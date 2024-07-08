import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TPartenaireRow} from 'types/alias';

type TFetchedData = TPartenaireRow[];

const fetchPartenaireListe = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('partenaire_tag')
    .select()
    .eq('collectivite_id', collectivite_id);

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const usePartenaireListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['partenaires', collectivite_id], () =>
    fetchPartenaireListe(collectivite_id!)
  );
};
