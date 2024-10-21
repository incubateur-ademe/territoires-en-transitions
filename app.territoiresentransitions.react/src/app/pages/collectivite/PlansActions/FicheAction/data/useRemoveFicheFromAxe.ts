import { useMutation, useQueryClient } from 'react-query';
import { supabaseClient } from 'core-logic/api/supabase';
import { FicheAction } from '@tet/api/plan-actions';

type Args = {
  axe_id: number;
  fiche_id: number;
};

export const useRemoveFicheFromAxe = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ axe_id, fiche_id }: Args) => {
      await supabaseClient.rpc('enlever_fiche_action_d_un_axe', {
        axe_id,
        fiche_id,
      });
    },
    {
      mutationKey: 'remove_fiche_from_axe',
      onMutate: async (args) => {
        const ficheActionKey = ['fiche_action', args.fiche_id.toString()];

        await queryClient.cancelQueries({ queryKey: ficheActionKey });

        const previousAction: { fiche: FicheAction } | undefined =
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
