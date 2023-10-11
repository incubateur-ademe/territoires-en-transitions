import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FicheResume} from './types';
import {sortFichesResume} from './utils';

export const useFichesNonClasseesListe = (collectivite_id: number) => {
  return useQuery(['fiches_non_classees', collectivite_id], async () => {
    const {data} = await supabaseClient
      .from('fiche_resume')
      .select('*', {count: 'exact'})
      .eq('collectivite_id', collectivite_id)
      .is('plans', null);

    return data ? sortFichesResume(data as FicheResume[]) : [];
  });
};
