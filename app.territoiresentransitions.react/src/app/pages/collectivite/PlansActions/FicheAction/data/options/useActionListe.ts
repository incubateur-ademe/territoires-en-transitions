import { useQuery } from 'react-query';

import { DBClient } from '@/api';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TActionStatutsRow } from '@/app/types/alias';

const fetchActionListe = async (
  supabase: DBClient,
  collectivite_id: number,
  actionsIds?: string[]
) => {
  const query = supabase
    .from('action_statuts')
    .select(
      'action_id, referentiel, nom, identifiant, avancement, avancement_descendants, desactive, concerne'
    )
    .eq('collectivite_id', collectivite_id)
    .in('type', ['action', 'sous-action']);

  if (actionsIds?.length) {
    query.in('action_id', actionsIds);
  }

  query.order('action_id', { ascending: true });

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as TActionStatutsRow[];
};

export const useActionListe = (actionsIds?: string[]) => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery(
    ['actions_referentiels', collectivite_id, actionsIds],
    () => fetchActionListe(supabase, collectivite_id!, actionsIds),
    DISABLE_AUTO_REFETCH
  );
};
