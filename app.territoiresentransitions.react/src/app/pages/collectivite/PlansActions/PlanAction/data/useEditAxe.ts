import { useMutation, useQueryClient } from 'react-query';

import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TPlanType } from '@/app/types/alias';
import { PlanNode } from './types';

/**
 * Édite un axe dans un plan d'action
 */
export const useEditAxe = (planId: number) => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  // clés dans le cache
  const flat_axes_key = ['flat_axes', planId];
  const navigation_key = ['plans_navigation', collectivite_id];
  const plan_type_key = ['plan_type', planId];

  return useMutation(
    async (axe: PlanNode & { type: TPlanType | null }) => {
      await supabase
        .from('axe')
        .update({ nom: axe.nom, type: axe.type?.id })
        .eq('id', axe.id);
    },
    {
      onMutate: async (axe) => {
        await queryClient.cancelQueries({ queryKey: flat_axes_key });
        await queryClient.cancelQueries({ queryKey: navigation_key });
        await queryClient.cancelQueries({ queryKey: plan_type_key });

        const previousData = [
          [flat_axes_key, queryClient.getQueryData(flat_axes_key)],
          [navigation_key, queryClient.getQueryData(navigation_key)],
          [plan_type_key, queryClient.getQueryData(plan_type_key)],
        ];

        // update les axes d'un plan
        queryClient.setQueryData(flat_axes_key, (old: PlanNode[] | undefined) =>
          old ? old.map((a) => (a.id !== axe.id ? a : axe)) : []
        );

        // update les axes de la navigation
        queryClient.setQueryData(
          navigation_key,
          (old: PlanNode[] | undefined) =>
            old ? old.map((a) => (a.id !== axe.id ? a : axe)) : []
        );

        // update le type d'un plan
        queryClient.setQueryData(
          plan_type_key,
          (): TPlanType | null => axe.type
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
        queryClient.invalidateQueries(plan_type_key);
      },
    }
  );
};
