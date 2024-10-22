import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from 'react-query';
import { PlanNode } from './types';

export const useDeleteAxe = (
  axe_id: number,
  planId: number,
  redirectURL?: string
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const router = useRouter();

  const flat_axes_key = ['flat_axes', planId];
  const navigation_key = ['plans_navigation', collectivite_id];

  return useMutation(
    async () => {
      await supabaseClient.rpc('delete_axe_all', { axe_id });
    },
    {
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: flat_axes_key });
        await queryClient.cancelQueries({ queryKey: navigation_key });

        const previousData = [
          [flat_axes_key, queryClient.getQueryData(flat_axes_key)],
          [navigation_key, queryClient.getQueryData(navigation_key)],
        ];

        // update l'axe d'un plan
        // ne supprime que l'axe parent et non les enfants
        // ceux ci ne sont pas affichés et retirer lors de l'invalidation
        queryClient.setQueryData(flat_axes_key, (old: PlanNode[] | undefined) =>
          old ? old.filter((a) => a.id !== axe_id) : []
        );

        // update les axes de la navigation
        // ne supprime que l'axe parent et non les enfants
        // ceux ci ne sont pas affichés et retirer lors de l'invalidation
        queryClient.setQueryData(
          navigation_key,
          (old: PlanNode[] | undefined) =>
            old ? old.filter((a) => a.id !== axe_id) : []
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
        redirectURL && router.push(redirectURL);
      },
    }
  );
};
