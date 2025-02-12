import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import useSWR from 'swr';

/** Charge la liste des collectivités */
const getCollectivites = async (supabase: DBClient, nom?: string) => {
  const query = supabase
    .from('collectivite_card')
    .select('value: collectivite_id, label: nom');

  if (nom) {
    query.ilike('nom', `%${nom}%`);
  } else {
    query.limit(15);
  }

  const { data } = await query;

  return (data || []) as Array<{ value: number; label: string }>;
};

export const useCollectivites = (nom?: string) => {
  const supabase = useSupabase();
  return useSWR(['signup-collectivite', nom], () =>
    getCollectivites(supabase, nom)
  );
};
