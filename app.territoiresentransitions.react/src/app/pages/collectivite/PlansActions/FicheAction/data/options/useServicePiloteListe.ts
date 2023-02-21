import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {TFicheActionServicePiloteRow} from '../types/alias';
import {useCollectiviteId} from 'core-logic/hooks/params';

export const useServicePiloteListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['services_pilotes', collectivite_id], async () => {
    const {data} = await supabaseClient
      .from('service_tag')
      .select()
      .eq('collectivite_id', collectivite_id)
      .order('nom');
    return data as unknown as TFicheActionServicePiloteRow[];
  });
};
