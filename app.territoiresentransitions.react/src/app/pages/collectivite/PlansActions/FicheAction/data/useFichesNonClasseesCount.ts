import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useQuery } from 'react-query';

/** Renvoi le nombre de fiches action non classées */
export const useFichesNonClasseesCount = (collectivite_id: number | null) => {
  return useQuery(['axe_fiches_count', collectivite_id, null], async () => {
    if (!collectivite_id) return 0;

    const { count } = await supabaseClient
      .from('fiche_resume')
      .select('*', { count: 'exact', head: true })
      .eq('collectivite_id', collectivite_id)
      .is('plans', null);

    return count || 0;
  });
};
