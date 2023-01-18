import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {IndicateurGlobal} from '../types/indicateurGlobal';

type TFetchedData = IndicateurGlobal[];

const fetchIndicateurListe = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('indicateurs_collectivite')
    .select()
    .or(`collectivite_id.is.null, collectivite_id.eq.${collectivite_id}`)
    .order('nom', {ascending: true});

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useIndicateurListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['indicateurs', collectivite_id], () =>
    fetchIndicateurListe(collectivite_id!)
  );
};
