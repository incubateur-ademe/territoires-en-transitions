import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {IActionStatutsRead} from 'generated/dataLayer/action_statuts_read';

type TFetchedData = IActionStatutsRead[];

const fetchActionListe = async (
  collectivite_id: number
): Promise<TFetchedData> => {
  const query = supabaseClient
    .from('action_statuts')
    .select('action_id, referentiel, nom, identifiant, avancement')
    .match({collectivite_id, concerne: true})
    .in('type', ['action', 'sous-action'])
    .order('action_id', {ascending: true});

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as any;
};

export const useActionListe = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['actions_referentiels', collectivite_id], () =>
    fetchActionListe(collectivite_id!)
  );
};
