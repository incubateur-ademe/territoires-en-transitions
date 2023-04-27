import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';
import {FicheResume} from '../../FicheAction/data/types';

type Args = {
  ficheIds: number[];
  axeId: number;
};

export const useAxeFiches = ({ficheIds, axeId}: Args) => {
  return useQuery(['axe_fiches', axeId], async () => {
    const {data} = await supabaseClient
      .from('fiche_resume')
      .select()
      .in('id', ficheIds);

    return data as FicheResume[];
  });
};
