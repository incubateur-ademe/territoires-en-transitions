import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TFicheActionStructureRow} from 'types/alias';

export const useStructuresListe = () => {
  const collectivite_id = useCollectiviteId()!;

  return useQuery(['structures', collectivite_id], async () => {
    const {error, data} = await supabaseClient
      .from('structure_tag')
      .select()
      .eq('collectivite_id', collectivite_id)
      .order('nom');

    if (error) throw new Error(error.message);

    return data as TFicheActionStructureRow[];
  });
};
