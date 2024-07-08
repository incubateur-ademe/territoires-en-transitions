import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TFicheActionStructureRow} from 'types/alias';

const fetchStructureListe = async (
  collectivite_id: number
): Promise<TFicheActionStructureRow[]> => {
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

export const useStructureListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['structures', collectivite_id], () =>
    fetchStructureListe(collectivite_id!)
  );
};
