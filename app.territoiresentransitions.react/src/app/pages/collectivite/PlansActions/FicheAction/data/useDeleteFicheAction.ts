import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {useHistory, useParams} from 'react-router-dom';
import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';

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
  const {planUid} = useParams<{planUid: string}>();

  return useMutation(deleteFicheAction, {
    meta: {disableToast: true},
    onSuccess: () => {
      queryClient.invalidateQueries(['fiches_non_classees', collectivite_id]);
      queryClient.invalidateQueries(['plan_action', planUid]);
      if (planUid) {
        history.push(
          makeCollectivitePlanActionUrl({
            collectiviteId: collectivite_id!,
            planActionUid: planUid,
          })
        );
      } else {
        history.push(
          makeCollectivitePlansActionsSyntheseUrl({
            collectiviteId: collectivite_id!,
          })
        );
      }
    },
  });
};
