import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Personne} from '../types';

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

  return (
    (data as unknown as Personne[])
      // filtre pour éviter les entrées avec un nom vide (pb des invitations : en
      // attente de correctif back)
      ?.filter(p => p.nom?.trim())
  );
};

export const usePersonneListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['personnes', collectivite_id], () =>
    fetchPersonneListe(collectivite_id!)
  );
};
