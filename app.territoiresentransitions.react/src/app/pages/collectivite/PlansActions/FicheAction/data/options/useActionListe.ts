import { useQuery } from 'react-query';

import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TActionStatutsRow } from '@/app/types/alias';

const fetchActionListe = async (collectivite_id: number) => {
  const query = supabaseClient
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

  return useQuery(['actions_referentiels', collectivite_id], () =>
    fetchActionListe(collectivite_id!)
  );
};
