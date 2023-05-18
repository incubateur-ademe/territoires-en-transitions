import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useMutation, useQueryClient} from 'react-query';
import {useHistory} from 'react-router-dom';
import {PlanNode} from './types';
import {removeAxeFromPlan} from './utils';

export const useDeleteAxe = (
  axe_id: number,
  planGlobalId: number,
  redirectURL?: string
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();

  return useMutation(
    async () => {
      await supabaseClient.rpc('delete_axe_all', {axe_id});
    },
    {
      mutationKey: 'delete_axe',
      onMutate: async () => {
        const planActionKey = ['plan_action', planGlobalId];
        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({queryKey: planActionKey});

        // Snapshot the previous value
        const previousAction: {plan: PlanNode} | undefined =
          queryClient.getQueryData(planActionKey);

        // Optimistically update to the new value
        queryClient.setQueryData(planActionKey, (old: any | PlanNode) => {
          return removeAxeFromPlan(old, axe_id);
        });

        // Return a context object with the snapshotted value
        return {previousAction};
      },
      onSettled: (data, err, args, context) => {
        if (err) {
          queryClient.setQueryData(
            ['plan_action', planGlobalId],
            context?.previousAction
          );
        }
        queryClient.invalidateQueries(['plan_action', planGlobalId]);
        queryClient.invalidateQueries(['plan_action', axe_id]);
        queryClient.invalidateQueries(['plans_actions', collectivite_id]);
        queryClient.invalidateQueries(['plans_navigation', collectivite_id]);
        redirectURL && history.push(redirectURL);
      },
    }
  );
};
