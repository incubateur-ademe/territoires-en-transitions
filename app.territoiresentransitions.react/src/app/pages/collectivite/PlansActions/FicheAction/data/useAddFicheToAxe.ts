import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Args = {
  fiche_id: number;
  axe: {
    id: number;
    nom: string;
    parentId: number | null;
    planId: number | null;
  };
};

export const useAddFicheToAxe = () => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const trpcUtils = trpc.useUtils();

  return useMutation({
    mutationFn: async ({ axe, fiche_id }: Args) => {
      await supabase.rpc('ajouter_fiche_action_dans_un_axe', {
        axe_id: axe.id,
        fiche_id,
      });
    },
    onMutate: async (args) => {
      const ficheActionKey = ['fiche_action', args.fiche_id];
      // Cancel any outgoing refetches, so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ficheActionKey });

      const ficheBeforeMutation = trpcUtils.plans.fiches.get.getData({
        id: args.fiche_id,
      });

      if (!ficheBeforeMutation) {
        throw new Error('Fiche not found');
      }

      // Optimistically update to the new value
      trpcUtils.plans.fiches.get.setData(
        {
          id: args.fiche_id,
        },
        (fiche) => {
          if (!fiche) {
            throw new Error('Fiche not found');
          }

          return {
            ...fiche,
            axes: fiche.axes ? [...fiche.axes, args.axe] : [args.axe],
          };
        }
      );

      // Return a context object
      return { ficheBeforeMutation };
    },
    onSettled: (data, err, args, context) => {
      const { fiche_id } = args;

      if (err) {
        queryClient.setQueryData(
          ['fiche_action', fiche_id],
          context?.ficheBeforeMutation
        );
      }

      trpcUtils.plans.fiches.get.invalidate({ id: fiche_id });
      queryClient.invalidateQueries({
        queryKey: ['plans_actions', collectiviteId],
      });
    },
  });
};
