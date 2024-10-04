import { supabaseClient } from 'core-logic/api/supabase';
import { useQuery } from 'react-query';
import { sortFichesResume } from '../../FicheAction/data/utils';
import { FicheResume } from '@tet/api/plan-actions';
import { objectToCamel } from 'ts-case-convert';

type Args = {
  ficheIds: number[];
  axeId: number;
};

export const useAxeFiches = ({ ficheIds, axeId }: Args) => {
  return useQuery(['axe_fiches', axeId, ficheIds], async () => {
    const { data } = await supabaseClient
      .from('fiche_resume')
      .select()
      .in('id', ficheIds);

    return sortFichesResume(objectToCamel(data ?? []) as FicheResume[]);
  });
};
