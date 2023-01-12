import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Personne} from '../types/personne';

type TFetchedData = Personne[];

const fetchPersonnePiloteListe = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('fiche_action_personne_pilote')
    .select()
    .eq('collectivite_id', collectivite_id);

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Personne[];
};

export const usePersonnePiloteListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['personnes_pilotes', collectivite_id], () =>
    fetchPersonnePiloteListe(collectivite_id!)
  );
};
