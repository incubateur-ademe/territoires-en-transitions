import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { FicheResume } from '@/domain/plans/fiches';
import { Plan } from '@/domain/plans/plans';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

type Args = {
  collectiviteId: number;
  ficheId: number;
  axeId: number | null;
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
  const trpcClient = useTRPC();
  const { ficheId, axeId, collectiviteId, planId } = args;

  const axe_fiches_key = ['axe_fiches', axeId];

  return useMutation({
    mutationFn: async () => {
      const { data } = await supabase
        .from('fiche_action')
        .delete()
        .eq('id', ficheId)
        .select();
      return data;
    },
    meta: { disableToast: true },
    onMutate: async () => {
      const previousData = [
        [axe_fiches_key, queryClient.getQueryData(axe_fiches_key)],
      ];
      if (planId) {
        previousData.push([
          trpcClient.plans.plans.get.queryKey({ planId }),
          queryClient.getQueryData(
            trpcClient.plans.plans.get.queryKey({ planId })
          ),
        ]);
      }

      queryClient.setQueryData(
        axe_fiches_key,
        (old: FicheResume[] | undefined): FicheResume[] => {
          return old?.filter((f) => f.id !== ficheId) || [];
        }
      );

      if (planId) {
        queryClient.setQueryData(
          trpcClient.plans.plans.get.queryKey({ planId }),
          (old): Plan | undefined => {
            if (!old) {
              return undefined;
            }
            const updatedAxes = old.axes.map((a) =>
              a.id === axeId
                ? {
                  ...a,
                  fiches: a.fiches?.filter((f) => f !== ficheId) ?? null,
                }
                : a
            );
            return {
              ...old,
              axes: updatedAxes,
            };
          }
        );
      }

      return previousData;
    },
    onError: (err, args, previousData) => {
      previousData?.forEach(([key, data]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpcClient.plans.fiches.listFilteredFiches.queryKey({
          collectiviteId,
        }),
      });
      queryClient.invalidateQueries({ queryKey: axe_fiches_key });
      if (planId) {
        queryClient.invalidateQueries({
          queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
        });
      }

      if (args.redirectPath) {
        router.push(args.redirectPath);
      }
    },
  });
};
