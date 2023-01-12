import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {useHistory} from 'react-router-dom';
import {makeCollectivitePlansActionsBaseUrl} from 'app/paths';

/** Supprime une fiche action d'une collectivité */
const deleteFicheAction = async (ficheId: number) => {
  let query = supabaseClient.from('fiche_action').delete().eq('id', ficheId);

  const {error} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

/**
 * Supprime une fiche action d'une collectivité
 */
export const useDeleteFicheAction = () => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();

  return useMutation(deleteFicheAction, {
    onSuccess: () => {
      queryClient.invalidateQueries(['fiches_non_classees', collectivite_id]);
      history.push(
        makeCollectivitePlansActionsBaseUrl({collectiviteId: collectivite_id!})
      );
    },
  });
};
