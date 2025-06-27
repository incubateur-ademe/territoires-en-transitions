import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from 'react-query';

type Args = {
  ficheId: number;
  /** Invalider la cle axe_fiches et l'optimistique update */
  axeId: number | null;
  /** Invalider la cle flat_axes et l'optimistique update */
  planId: number | null;
  /** Url de redirection à la suppression de la fiche */
  redirectPath?: string;
};

/**
 * Supprime une fiche action d'une collectivité
 */
export const useDeleteFicheAction = (args: Args) => {
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

        if (args.redirectPath) {
          router.push(args.redirectPath);
        }
      },
    }
  );
};
