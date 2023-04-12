import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FicheResume} from './types';

type TFetchedData = FicheResume[];

const fetchFicheResumeListe = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('fiche_resume')
    .select()
    .match({collectivite_id})
    .order('plans', {ascending: true});

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as TFetchedData;
};

export const useFicheResumeListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['fiches_resume_collectivite', collectivite_id], () =>
    fetchFicheResumeListe(collectivite_id!)
  );
};
