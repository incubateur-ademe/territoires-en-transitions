import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Personne} from '../types';

type TFetchedData = Personne[];

const fetchPersonneReferenteListe = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('fiche_action_personne_referente')
    .select()
    .eq('collectivite_id', collectivite_id);

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Personne[];
};

export const usePersonneReferenteListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['personnes_referentes', collectivite_id], () =>
    fetchPersonneReferenteListe(collectivite_id!)
  );
};
