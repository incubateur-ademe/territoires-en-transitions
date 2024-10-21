import { supabaseClient } from 'core-logic/api/supabase';
import { QueryKey, useMutation, useQueryClient } from 'react-query';

import { FicheResume } from '@tet/api/plan-actions';
import {
  makeCollectivitePlanActionUrl,
  makeCollectiviteToutesLesFichesUrl,
} from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useParams, useRouter } from 'next/navigation';
import { PlanNode } from '../../PlanAction/data/types';

type Args = {
  ficheId: number;
  /** Invalider la cle axe_fiches */
  axeId: number | null;
  keysToInvalidate?: QueryKey[];
  /** Redirige vers le plan ou la page toutes les fiches action à la suppression de la fiche */
  redirect?: boolean;
};

/**
 * Supprime une fiche action d'une collectivité
 */
export const useDeleteFicheAction = (args: Args) => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { planUid } = useParams<{ planUid: string }>();

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
        if (args.redirect) {
          if (planUid) {
            router.push(
              makeCollectivitePlanActionUrl({
                collectiviteId: collectivite_id!,
                planActionUid: planUid,
              })
            );
          } else {
            router.push(
              makeCollectiviteToutesLesFichesUrl({
                collectiviteId: collectivite_id!,
              })
            );
          }
        }
      },
    }
  );
};
