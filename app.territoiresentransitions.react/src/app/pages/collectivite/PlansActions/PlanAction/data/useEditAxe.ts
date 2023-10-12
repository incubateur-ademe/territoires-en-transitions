import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {PlanNode} from './types';
import {useCollectiviteId} from 'core-logic/hooks/params';

/**
 * Édite un axe dans un plan d'action
 */
export const useEditAxe = (planId: number) => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();

  // clés dans le cache
  const flat_axes_key = ['flat_axes', planId];
  const navigation_key = ['plans_navigation', collectivite_id];

  return useMutation(
    async (axe: PlanNode) => {
      await supabaseClient.from('axe').update({nom: axe.nom}).eq('id', axe.id);
    },
    {
      onMutate: async axe => {
        await queryClient.cancelQueries({queryKey: flat_axes_key});
        await queryClient.cancelQueries({queryKey: navigation_key});

        const previousData = [
          [flat_axes_key, queryClient.getQueryData(flat_axes_key)],
          [navigation_key, queryClient.getQueryData(navigation_key)],
        ];

        // update les axes d'un plan
        queryClient.setQueryData(flat_axes_key, (old: PlanNode[] | undefined) =>
          old ? old.map(a => (a.id !== axe.id ? a : axe)) : []
        );

        // update les axes de la navigation
        queryClient.setQueryData(
          navigation_key,
          (old: PlanNode[] | undefined) =>
            old ? old.map(a => (a.id !== axe.id ? a : axe)) : []
        );

        return previousData;
      },
      onError: (err, axe, previousData) => {
        previousData?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries(flat_axes_key);
        queryClient.invalidateQueries(navigation_key);
      },
    }
  );
};
