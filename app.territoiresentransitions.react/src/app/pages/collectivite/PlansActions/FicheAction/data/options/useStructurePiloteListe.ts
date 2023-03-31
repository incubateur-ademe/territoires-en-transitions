import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TFicheActionStructureRow} from 'types/alias';

type TFetchedData = TFicheActionStructureRow[];

const fetchStructurePiloteListe = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('structure_tag')
    .select()
    .eq('collectivite_id', collectivite_id);

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useStructurePiloteListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['structures', collectivite_id], () =>
    fetchStructurePiloteListe(collectivite_id!)
  );
};
