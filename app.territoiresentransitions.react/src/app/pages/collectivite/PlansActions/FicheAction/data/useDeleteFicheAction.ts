import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {useHistory, useLocation, useParams} from 'react-router-dom';
import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import {FicheResume} from './types';
import {PlanNode} from '../../PlanAction/data/types';

type Args = {
  ficheId: number;
  /** Invalider la cle axe_fiches et savoir s'il faut rediriger ou non */
  axeId?: number;
};

/**
 * Supprime une fiche action d'une collectivité
 */
export const useDeleteFicheAction = (args: Args) => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const history = useHistory();
  const {planUid} = useParams<{planUid: string}>();
  const {pathname} = useLocation();

  const {ficheId, axeId} = args;
  const planActionId = parseInt(planUid);

  const axe_fiches_key = ['axe_fiches', axeId];
  const flat_axes_Key = ['flat_axes', planActionId];
  const fiches_non_classees_key = ['fiches_non_classees', collectivite_id];

  return useMutation(
    async () => {
      await supabaseClient.from('fiche_action').delete().eq('id', ficheId);
    },
    {
      meta: {disableToast: true},
      onMutate: async args => {
        const previousData = [
          [axe_fiches_key, queryClient.getQueryData(axe_fiches_key)],
          [
            fiches_non_classees_key,
            queryClient.getQueryData(fiches_non_classees_key),
          ],
          [flat_axes_Key, queryClient.getQueryData(flat_axes_Key)],
        ];

        queryClient.setQueryData(
          axe_fiches_key,
          (old: FicheResume[] | undefined): FicheResume[] => {
            return old?.filter(f => f.id !== ficheId) || [];
          }
        );

        queryClient.setQueryData(
          flat_axes_Key,
          (old: PlanNode[] | undefined): PlanNode[] => {
            if (old) {
              return old.map(a =>
                a.id === axeId
                  ? {
                      ...a,
                      fiches: a.fiches?.filter(f => f !== ficheId) ?? null,
                    }
                  : a
              );
            } else {
              return [];
            }
          }
        );

        queryClient.setQueryData(
          fiches_non_classees_key,
          (old: FicheResume[] | undefined): FicheResume[] => {
            return old?.filter(f => f.id !== ficheId) || [];
          }
        );

        return previousData;
      },
      onError: (err, args, previousData) => {
        previousData?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries(fiches_non_classees_key);
        queryClient.invalidateQueries(axe_fiches_key);
        queryClient.invalidateQueries(flat_axes_Key);
        if (!axeId) {
          if (planUid) {
            history.push(
              makeCollectivitePlanActionUrl({
                collectiviteId: collectivite_id!,
                planActionUid: planUid,
              })
            );
          }
          if (pathname.includes('fiches')) {
            const fiches = queryClient.getQueryData(
              fiches_non_classees_key
            ) as FicheResume[];
            if (fiches?.length > 0) {
              history.push(
                makeCollectiviteFichesNonClasseesUrl({
                  collectiviteId: collectivite_id!,
                })
              );
            } else {
              history.push(
                makeCollectivitePlansActionsSyntheseUrl({
                  collectiviteId: collectivite_id!,
                })
              );
            }
          }
        }
      },
    }
  );
};
