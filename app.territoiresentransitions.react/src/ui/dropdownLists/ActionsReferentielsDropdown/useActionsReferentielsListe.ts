import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TActionStatutsRow } from '@/app/types/alias';
import { useQuery } from 'react-query';

export const useActionsReferentielsListe = () => {
  const collectivite_id = useCollectiviteId()!;

  return useQuery(['actions_referentiels', collectivite_id], async () => {
    const { error, data } = await supabaseClient
      .from('action_statuts')
      .select(
        'action_id, referentiel, nom, identifiant, avancement, avancement_descendants, desactive, concerne'
      )
      .eq('collectivite_id', collectivite_id)
      .in('type', ['action', 'sous-action'])
      .order('action_id', { ascending: true });

    if (error) throw new Error(error.message);

    return data as TActionStatutsRow[];
  });
};
