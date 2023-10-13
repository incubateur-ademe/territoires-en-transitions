import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';
import {FicheResume} from '../../FicheAction/data/types';
import {sortFichesResume} from '../../FicheAction/data/utils';

type Args = {
  ficheIds: number[];
  axeId: number;
};

export const useAxeFiches = ({ficheIds, axeId}: Args) => {
  return useQuery(['axe_fiches', axeId, ficheIds], async () => {
    const {data} = await supabaseClient
      .from('fiche_resume')
      .select()
      .in('id', ficheIds);

    return sortFichesResume(data as FicheResume[]);
  });
};
