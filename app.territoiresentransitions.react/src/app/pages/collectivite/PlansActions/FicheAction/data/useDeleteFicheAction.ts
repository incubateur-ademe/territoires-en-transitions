import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import {
  makeCollectivitePlanActionUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from 'react-query';

type Args = {
  ficheId: number;
  /** Invalider la cle axe_fiches et l'optimistique update */
  axeId: number | null;
  /** Invalider la cle flat_axes et l'optimistique update */
  planId: number | null;
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
  const supabase = useSupabase();
  const utils = trpc.useUtils();

  const collectiviteId = useCollectiviteId();

  const { ficheId, axeId, planId } = args;

  const axe_fiches_key = ['axe_fiches', axeId];
  const flat_axes_Key = ['flat_axes', planId];

  return useMutation(
    async () => {
      await supabase.from('fiche_action').delete().eq('id', ficheId);
    },
    {
      meta: { disableToast: true },
      onSuccess: () => {
        utils.plans.fiches.listResumes.invalidate({
          collectiviteId,
        });
        queryClient.invalidateQueries(axe_fiches_key);
        queryClient.invalidateQueries(flat_axes_Key);

        if (args.redirect) {
          if (planId) {
            router.push(
              makeCollectivitePlanActionUrl({
                collectiviteId: collectivite_id,
                planActionUid: planId.toString(),
              })
            );
          } else {
            router.push(
              makeCollectiviteToutesLesFichesUrl({
                collectiviteId: collectivite_id,
              })
            );
          }
        }
      },
    }
  );
};
