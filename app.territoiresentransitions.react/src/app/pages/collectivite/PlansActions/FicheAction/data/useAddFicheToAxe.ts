import {useMutation, useQueryClient} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FicheAction} from './types';
import {TProfondeurAxe} from '../../PlanAction/data/types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TAxeInsert} from 'types/alias';

type Args = {
  planAction_id: number;
  fiche_id: number;
  axe: TProfondeurAxe;
};

export const useAddFicheToAxe = () => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation(
    async ({axe, fiche_id}: Args) => {
      await supabaseClient.rpc('ajouter_fiche_action_dans_un_axe', {
        axe_id: axe.axe.id,
        fiche_id,
      });
    },
    {
      mutationKey: 'add_fiche_to_axe',
      onMutate: async args => {
        const ficheActionKey = ['fiche_action', args.fiche_id.toString()];
        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({queryKey: ficheActionKey});

        // Snapshot the previous value
        const previousAction: {fiche: FicheAction} | undefined =
          queryClient.getQueryData(ficheActionKey);

        // Optimistically update to the new value
        queryClient.setQueryData(ficheActionKey, (old: any) => {
          const formatedNewAxe: TAxeInsert = {
            collectivite_id: collectivite_id!,
            id: args.axe.axe.id,
            nom: args.axe.axe.nom,
          };
          return {
            fiche: {
              ...old.fiche,
              axes: old.fiche.axes
                ? [...old.fiche.axes, formatedNewAxe]
                : [formatedNewAxe],
            },
          };
        });

        // Return a context object with the snapshotted value
        return {previousAction};
      },
      onSettled: (data, err, args, context) => {
        const {fiche_id} = args;

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
