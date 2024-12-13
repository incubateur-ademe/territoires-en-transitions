import { Views } from '@/api';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useQuery } from 'react-query';

export type TCarteIdentite = Views<'collectivite_carte_identite'>;
type TUseCarteIdentite = (
  collectivite_id?: number | null
) => TCarteIdentite | null;

export const useCarteIdentite: TUseCarteIdentite = (collectivite_id) => {
  const { data } = useQuery(
    ['collectivite_carte_identite', collectivite_id],
    () => (collectivite_id ? fetchCarteIdentite(collectivite_id) : null)
  );

  return data || null;
};

const fetchCarteIdentite = async (collectivite_id: number) => {
  const { data } = await supabaseClient
    .from('collectivite_carte_identite')
    .select()
    .eq('collectivite_id', collectivite_id);
  return data?.[0] || null;
};
