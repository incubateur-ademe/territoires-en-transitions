import {useMutation, useQueryClient} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FicheResume} from './types';
import {PlanNode} from '../../PlanAction/data/types';
import {ficheChangeAxeDansPlan} from '../../PlanAction/data/utils';

type Args = {
  fiche_id: number;
  plan_id: number;
  old_axe_id: number;
  new_axe_id: number;
};

export const useFicheChangeAxe = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({fiche_id, new_axe_id, old_axe_id}: Args) => {
      await supabaseClient.rpc('deplacer_fiche_action_dans_un_axe', {
        fiche_id,
        new_axe_id,
        old_axe_id,
      });
    },
    {
      mutationKey: 'fiche_change_axe',
      onMutate: async args => {
        const planActionKey = ['plan_action', args.plan_id];
        // /** TEST PLAN_ACTION KEY */
        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({queryKey: planActionKey});

        // Snapshot the previous value
        const previousAction: {plan: PlanNode} | undefined =
          queryClient.getQueryData(planActionKey);

        queryClient.setQueryData(planActionKey, (old: any) => {
          return ficheChangeAxeDansPlan(
            old,
            args.fiche_id,
            args.old_axe_id,
            args.new_axe_id
          );
        });

        queryClient.setQueryData(
          ['axe_fiches', args.old_axe_id],
          (old: FicheResume[] | undefined): FicheResume[] => {
            console.log(old);
            console.log(args.fiche_id);
            return (
              old?.filter((fiche: FicheResume) => fiche.id !== args.fiche_id) ||
              []
            );
          }
        );

        // Return a context object with the snapshotted value
        return {previousAction};
      },
      onSettled: (data, err, args, context) => {
        if (err) {
          queryClient.setQueryData(
            ['plan_action', args.plan_id],
            context?.previousAction
          );
        }
        queryClient.invalidateQueries(['plan_action', args.plan_id]);
        queryClient.invalidateQueries(['axe_fiches', args.old_axe_id]);
        queryClient.invalidateQueries(['axe_fiches', args.new_axe_id]);
      },
    }
  );
};
