import { useQuery } from 'react-query';

import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TFicheActionServicePiloteRow } from '@/app/types/alias';

export const useServicePiloteListe = () => {
  const collectivite_id = useCollectiviteId()!;
  const supabase = useSupabase();

  return useQuery(['services_pilotes', collectivite_id], async () => {
    const { data } = await supabase
      .from('service_tag')
      .select()
      .eq('collectivite_id', collectivite_id)
      .order('nom');
    return data as unknown as TFicheActionServicePiloteRow[];
  });
};
