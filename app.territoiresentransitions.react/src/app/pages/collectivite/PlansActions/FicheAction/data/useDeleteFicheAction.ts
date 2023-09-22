import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {useHistory, useParams} from 'react-router-dom';
import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import {FicheResume} from './types';
import {PlanNode} from '../../PlanAction/data/types';
import {deleteFicheFromAxe} from '../../PlanAction/data/utils';

type Args = {
  ficheId: number;
  axeId?: number;
  planActionId?: number;
};

/**
 * Supprime une fiche action d'une collectivité
 */
export const useDeleteFicheAction = () => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();
  const {planUid} = useParams<{planUid: string}>();

  return useMutation(
    async ({ficheId}: Args) => {
      await supabaseClient.from('fiche_action').delete().eq('id', ficheId);
    },
    {
      meta: {disableToast: true},
      onMutate: async args => {
        const {ficheId, axeId, planActionId} = args;
        if (axeId) {
          // clés dans le cache
          const axeKey = ['axe_fiches', axeId];
          const planActionKey = ['plan_action', planActionId];

          // copie l'état précédent avant de modifier le cache
          const previousState = [
            [axeKey, queryClient.getQueryData(axeKey)],
            [planActionKey, queryClient.getQueryData(planActionKey)],
          ];

          // met à jour les listes des fiches d'un axe
          queryClient.setQueryData(
            axeKey,
            (old: FicheResume[] | undefined): FicheResume[] => {
              return old?.filter(f => f.id !== ficheId) || [];
            }
          );

          // met à jour les listes d'id de fiches dans l'arborescence
          queryClient.setQueryData(
            planActionKey,
            (old: PlanNode | undefined): PlanNode => {
              if (old) {
                return deleteFicheFromAxe(old, ficheId, axeId);
              }
              return old!;
            }
          );

          // Return a context object with the snapshotted value
          return previousState;
        }
      },
      onError: (err, args, previousState) => {
        // en cas d'erreur restaure l'état précédent
        previousState?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
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
    }
  );
};
