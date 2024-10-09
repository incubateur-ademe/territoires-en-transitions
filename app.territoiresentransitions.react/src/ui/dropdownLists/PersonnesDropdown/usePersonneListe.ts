import { fetchPersonnes } from '@tet/api/collectivites';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';

export const usePersonneListe = () => {
  const collectiviteId = useCollectiviteId()!;

  return useQuery(['personnes', collectiviteId], () =>
    fetchPersonnes(supabaseClient, collectiviteId)
  );
};
