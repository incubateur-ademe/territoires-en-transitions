import { DBClient, Views } from '@/api';
import { useSupabase } from '@/api';
import { useQuery } from '@tanstack/react-query';

export type TCarteIdentite = Views<'collectivite_carte_identite'>;
type TUseCarteIdentite = (
  collectivite_id?: number | null
) => TCarteIdentite | null;

export const useCarteIdentite: TUseCarteIdentite = (collectivite_id) => {
  const supabase = useSupabase();

  const { data } = useQuery({
    queryKey: ['collectivite_carte_identite', collectivite_id],

    queryFn: () =>
      collectivite_id ? fetchCarteIdentite(supabase, collectivite_id) : null,
  });

  return data || null;
};

const fetchCarteIdentite = async (
  supabase: DBClient,
  collectivite_id: number
) => {
  const { data } = await supabase
    .from('collectivite_carte_identite')
    .select()
    .eq('collectivite_id', collectivite_id);
  return data?.[0] || null;
};
