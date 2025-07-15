import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PlanNode } from '../../../../../../plans/plans/types';

export const useDeleteAxe = (
  axe_id: number,
  planId: number,
  redirectURL?: string
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const router = useRouter();
  const supabase = useSupabase();

  const flat_axes_key = ['flat_axes', planId];
  const navigation_key = ['plans_navigation', collectivite_id];

  return useMutation({
    mutationFn: async () => {
      await supabase.rpc('delete_axe_all', { axe_id });
    },
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
      queryClient.setQueryData(navigation_key, (old: PlanNode[] | undefined) =>
        old ? old.filter((a) => a.id !== axe_id) : []
      );

      return previousData;
    },
    onError: (err, axe, context) => {
      context?.forEach(([key, data]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: flat_axes_key });
      queryClient.invalidateQueries({ queryKey: navigation_key });
      redirectURL && router.push(redirectURL);
    },
  });
};
