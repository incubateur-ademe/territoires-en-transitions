import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TPersonne} from 'types/alias';

export type Personne = Omit<TPersonne, 'tag_id' | 'user_id'> & {
  tag_id?: number | null;
  user_id?: string | null;
};

type TFetchedData = Personne[];

const fetchPersonneListe = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .rpc('personnes_collectivite', {collectivite_id})
    .order('nom');

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as Personne[];
};

export const usePersonneListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['personnes', collectivite_id], () =>
    fetchPersonneListe(collectivite_id!)
  );
};
