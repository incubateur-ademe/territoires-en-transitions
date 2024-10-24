import { useMutation, useQueryClient } from 'react-query';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { TAxeInsert } from 'types/alias';
import { FicheAction } from '@tet/api/plan-actions';

type Args = {
  fiche_id: number;
  axe: {
    id: number;
    nom: string | null;
  };
};

export const useAddFicheToAxe = () => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation(
    async ({ axe, fiche_id }: Args) => {
      await supabaseClient.rpc('ajouter_fiche_action_dans_un_axe', {
        axe_id: axe.id,
        fiche_id,
      });
    },
    {
      mutationKey: 'add_fiche_to_axe',
      onMutate: async (args) => {
        const ficheActionKey = ['fiche_action', args.fiche_id.toString()];
        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ queryKey: ficheActionKey });

        // Snapshot the previous value
        const previousAction: { fiche: FicheAction } | undefined =
          queryClient.getQueryData(ficheActionKey);

        // Optimistically update to the new value
        queryClient.setQueryData(ficheActionKey, (old: any) => {
          const formatedNewAxe: TAxeInsert = {
            collectivite_id: collectivite_id!,
            id: args.axe.id,
            nom: args.axe.nom,
          };

          return {
            fiche: {
              ...old,
              axes: old.axes ? [...old.axes, formatedNewAxe] : [formatedNewAxe],
            },
          };
        });

        // Return a context object with the snapshotted value
        return { previousAction };
      },
      onSettled: (data, err, args, context) => {
        const { fiche_id } = args;

        if (err) {
          queryClient.setQueryData(
            ['fiche_action', fiche_id.toString()],
            context?.previousAction
          );
        }

        queryClient.invalidateQueries(['fiche_action', fiche_id.toString()]);
        queryClient.invalidateQueries(['plans_actions', collectivite_id]);
      },
    }
  );
};
