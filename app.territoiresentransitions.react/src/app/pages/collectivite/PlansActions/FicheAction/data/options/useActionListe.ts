import { useQuery } from 'react-query';

import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TActionStatutsRow } from '@/app/types/alias';

const fetchActionListe = async (
  supabase: DBClient,
  collectivite_id: number
) => {
  const query = supabase
    .from('action_statuts')
    .select(
      'action_id, referentiel, nom, identifiant, avancement, avancement_descendants, desactive, concerne'
    )
    .eq('collectivite_id', collectivite_id)
    .in('type', ['action', 'sous-action'])
    .order('action_id', { ascending: true });

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as TActionStatutsRow[];
};

export const useActionListe = () => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery(['actions_referentiels', collectivite_id], () =>
    fetchActionListe(supabase, collectivite_id!)
  );
};
