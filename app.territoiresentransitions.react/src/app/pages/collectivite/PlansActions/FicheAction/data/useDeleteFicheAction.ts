import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { FicheResume } from '@/backend/plans/fiches/index-domain';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from 'react-query';
import { PlanNode } from '../../../../../../plans/plans/types';

type Args = {
  collectiviteId: number;
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

  const { ficheId, axeId, collectiviteId, planId } = args;

  const axe_fiches_key = ['axe_fiches', axeId];
  const flat_axes_Key = ['flat_axes', planId];

  return useMutation(
    async () => {
      await supabase.from('fiche_action').delete().eq('id', ficheId);
    },
    {
      meta: { disableToast: true },
      onMutate: async () => {
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
            if (!old) {
              return [];
            }
            return old.map((a) =>
              a.id === axeId
                ? {
                    ...a,
                    fiches: a.fiches?.filter((f) => f !== ficheId) ?? null,
                  }
                : a
            );
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
