import { useHistory } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';

import { supabaseClient } from 'core-logic/api/supabase';
import { objectToCamel } from 'ts-case-convert';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { makeCollectiviteFicheNonClasseeUrl } from '@tet/app/paths';

/** Upsert une fiche action pour une collectivité */
const upsertFicheAction = async (collectiviteId: number) => {
  const query = supabaseClient
    .from('fiches_action')
    .insert({ collectivite_id: collectiviteId } as any)
    .select()
    .single();

  const { error, data } = await query;

  if (error) {
    throw error;
  }

  return objectToCamel(data);
};

export const useCreateFicheAction = () => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  return useMutation(() => upsertFicheAction(collectiviteId!), {
    meta: { disableToast: true },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['axe_fiches', null]);
      if (data.id) {
        const url = makeCollectiviteFicheNonClasseeUrl({
          collectiviteId: collectiviteId!,
          ficheUid: data.id.toString(),
        });
        history.push(url);
      }
    },
  });
};
