import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {dropAnimation} from '../DragAndDropNestedContainers/Arborescence';
import {PlanNode} from './types';
import {addAxeToPlan, getAxeInPlan, removeAxeFromPlan} from './utils';
import {updateAxe} from './useEditAxe';

/**
 * Déplace un axe dans un autre axe
 */
export const useDragAxe = (planId: number) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation(updateAxe, {
    onMutate: async args => {
      const axe = args;

      const planActionKey = ['plan_action', planId];
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({queryKey: planActionKey});

      // Snapshot the previous value
      const previousAction: {plan: PlanNode} | undefined =
        queryClient.getQueryData(planActionKey);

      // Optimistically update to the new value
      queryClient.setQueryData(planActionKey, (old: any | PlanNode) => {
        if (axe.id && axe.parent) {
          const axeAsPlanNode = getAxeInPlan(old, axe.id);
          const tempPlan = removeAxeFromPlan(old, axe.id);
          const newPlan =
            tempPlan && addAxeToPlan(tempPlan, axeAsPlanNode!, axe.parent);
          return newPlan;
        }
      });

      // Return a context object with the snapshotted value
      return {previousAction};
    },
    onSuccess: (data, args) => {
      queryClient.invalidateQueries(['plans_navigation', collectivite_id]);
      queryClient.invalidateQueries(['plan_action', planId]);

      args.id && dropAnimation(`axe-${args.id.toString()}`);
    },
  });
};
