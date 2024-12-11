import { FicheResume } from '@/api/plan-actions';
import { supabaseClient } from 'core-logic/api/supabase';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';
import { sortFichesResume } from './utils';

export const useFichesNonClasseesListe = (collectivite_id: number) => {
  return useQuery(['axe_fiches', null], async () => {
    const { data } = await supabaseClient
      .from('fiche_resume')
      .select('*', { count: 'exact' })
      .eq('collectivite_id', collectivite_id)
      .is('plans', null);

    return data ? sortFichesResume(objectToCamel(data) as FicheResume[]) : [];
  });
};
