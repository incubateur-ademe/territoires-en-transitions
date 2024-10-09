import { supabaseClient } from 'core-logic/api/supabase';
import { QueryKey, useMutation, useQueryClient } from 'react-query';

import { useCollectiviteId } from 'core-logic/hooks/params';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import { PlanNode } from '../../PlanAction/data/types';
import { FicheResume } from '@tet/api/plan-actions';

type Args = {
  ficheId: number;
  /** Invalider la cle axe_fiches et savoir s'il faut rediriger ou non */
  axeId: number | null;
  keysToInvalidate?: QueryKey[];
};

/**
 * Supprime une fiche action d'une collectivité
 */
export const useDeleteFicheAction = (args: Args) => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const history = useHistory();
  const { planUid } = useParams<{ planUid: string }>();
  const { pathname } = useLocation();

  const { ficheId, axeId } = args;
  const planActionId = parseInt(planUid);

  const axe_fiches_key = ['axe_fiches', axeId];
  const flat_axes_Key = ['flat_axes', planActionId];

  return useMutation(
    async () => {
      await supabaseClient.from('fiche_action').delete().eq('id', ficheId);
    },
    {
      meta: { disableToast: true },
      onMutate: async (args) => {
        const previousData = [
          [axe_fiches_key, queryClient.getQueryData(axe_fiches_key)],
          [flat_axes_Key, queryClient.getQueryData(flat_axes_Key)],
        ];

        queryClient.setQueryData(
          axe_fiches_key,
          (old: FicheResume[] | undefined): FicheResume[] => {
            return old?.filter((f) => f.id !== ficheId) || [];
          }
        );

        queryClient.setQueryData(
          flat_axes_Key,
          (old: PlanNode[] | undefined): PlanNode[] => {
            if (old) {
              return old.map((a) =>
                a.id === axeId
                  ? {
                      ...a,
                      fiches: a.fiches?.filter((f) => f !== ficheId) ?? null,
                    }
                  : a
              );
            } else {
              return [];
            }
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
        args.keysToInvalidate?.forEach((key) =>
          queryClient.invalidateQueries(key)
        );
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
          // Si la fiche est non classée
          if (pathname.includes('fiches')) {
            const fiches = queryClient.getQueryData(
              axe_fiches_key
            ) as FicheResume[];
            // Pas de redirection si l'utilisateur est sur la page "Fiches non classées" et qu'il y a d'autres fiches
            const pathnameItems = pathname.split('/');
            const lastPathnameItem = pathnameItems[pathnameItems.length - 1];
            // Tant qu'il y a plus d'une fiche dans la page "Fiches non classées" on redirige vers celle-ci
            if (fiches?.length > 0) {
              // Si l'action vient d'une page fiche action
              if (lastPathnameItem !== 'fiches') {
                history.push(
                  makeCollectiviteFichesNonClasseesUrl({
                    collectiviteId: collectivite_id!,
                  })
                );
              }
              // S'il n'y a plus de fiche dans la page "Fiches non classées"
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
