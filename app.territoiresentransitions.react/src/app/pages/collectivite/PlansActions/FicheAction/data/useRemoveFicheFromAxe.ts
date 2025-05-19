import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Args = {
  axe_id: number;
  fiche_id: number;
};

export const useRemoveFicheFromAxe = () => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const trpcUtils = trpc.useUtils();

  return useMutation({
    mutationFn: async ({ axe_id, fiche_id }: Args) => {
      await supabase.rpc('enlever_fiche_action_d_un_axe', {
        axe_id,
        fiche_id,
      });
    },
    onMutate: async (args) => {
      const ficheActionKey = ['fiche_action', args.fiche_id];
      // Cancel any outgoing refetches, so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ficheActionKey });

      const resultBeforeMutation = trpcUtils.plans.fiches.list.getData({
        collectiviteId,
        filters: {
          ficheIds: [args.fiche_id],
        },
      });

      if (!resultBeforeMutation) {
        throw new Error('Fiche not found');
      }

      const [ficheBeforeMutation] = resultBeforeMutation;

      // Optimistically update to the new value
      trpcUtils.plans.fiches.list.setData(
        {
          collectiviteId,
          filters: {
            ficheIds: [args.fiche_id],
          },
        },
        (old) => {
          if (!old) {
            throw new Error('Fiche not found');
          }

          const [fiche] = old;

          return [
            {
              ...fiche,
              axes: fiche.axes?.filter((axe) => axe.id !== args.axe_id) ?? [],
            },
          ];
        }
      );

      // Return a context object
      return { ficheBeforeMutation };
    },
    onSettled: (data, err, args, context) => {
      if (err) {
        trpcUtils.plans.fiches.list.setData(
          {
            collectiviteId,
            filters: {
              ficheIds: [args.fiche_id],
            },
          },
          () =>
            context?.ficheBeforeMutation
              ? [context.ficheBeforeMutation]
              : undefined
        );
      }

      // Invalidate both the specific fiche and the plans list
      trpcUtils.plans.fiches.list.invalidate();
      queryClient.invalidateQueries({
        queryKey: ['plans_actions', collectiviteId],
      });
    },
  });
};
