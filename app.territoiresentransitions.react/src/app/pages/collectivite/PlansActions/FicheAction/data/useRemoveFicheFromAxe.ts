import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { Fiche } from '@/domain/plans/fiches';
import { useMutation, useQueryClient } from 'react-query';

type Args = {
  axe_id: number;
  fiche_id: number;
};

export const useRemoveFicheFromAxe = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation(
    async ({ axe_id, fiche_id }: Args) => {
      await supabase.rpc('enlever_fiche_action_d_un_axe', {
        axe_id,
        fiche_id,
      });
    },
    {
      mutationKey: 'remove_fiche_from_axe',
      onMutate: async (args) => {
        const ficheActionKey = ['fiche_action', args.fiche_id.toString()];

        await queryClient.cancelQueries({ queryKey: ficheActionKey });

        const previousAction: { fiche: Fiche } | undefined =
          queryClient.getQueryData(ficheActionKey);

        queryClient.setQueryData(ficheActionKey, (old: any) => {
          return {
            fiche: {
              ...old,
              axes: old.axes!.filter((axe: any) => axe.id !== args.axe_id),
            },
          };
        });

        return { previousAction };
      },
      onSettled: (data, err, args, context) => {
        if (err) {
          queryClient.setQueryData(
            ['fiche_action', args.fiche_id.toString()],
            context?.previousAction
          );
        }

        const { fiche_id } = args;
        queryClient.invalidateQueries(['fiche_action', fiche_id.toString()]);
      },
    }
  );
};
