import { FicheResume } from '@/api/plan-actions';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';
import { sortFichesResume } from './utils';

export const useFichesNonClasseesListe = (collectivite_id: number) => {
  const supabase = useSupabase();

  return useQuery(['axe_fiches', null], async () => {
    const { data } = await supabase
      .from('fiche_resume')
      .select('*', { count: 'exact' })
      .eq('collectivite_id', collectivite_id)
      .is('plans', null);

    return data ? sortFichesResume(objectToCamel(data) as FicheResume[]) : [];
  });
};
