import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { Plan, PlanNode, PlanType } from '@/domain/plans/plans';

/**
 * Édite un axe dans un plan d'action
 */
export const useEditAxe = (planId: number) => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const trpcClient = useTRPC();

  // clés dans le cache
  const navigation_key = ['plans_navigation', collectivite_id];
  const plan_type_key = ['plan_type', planId];
  return useMutation({
    mutationFn: async (axe: PlanNode & { type: PlanType | null }) => {
      await supabase
        .from('axe')
        .update({ nom: axe.nom, type: axe.type?.id ?? null })
        .eq('id', axe.id);
    },
    onMutate: async (axe: PlanNode & { type: PlanType | null }) => {
      await queryClient.cancelQueries({
        queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
      });
      await queryClient.cancelQueries({ queryKey: navigation_key });
      await queryClient.cancelQueries({ queryKey: plan_type_key });

      const previousData = [
        [navigation_key, queryClient.getQueryData(navigation_key)],
        [plan_type_key, queryClient.getQueryData(plan_type_key)],
        [
          trpcClient.plans.plans.get.queryKey({ planId }),
          queryClient.getQueryData(
            trpcClient.plans.plans.get.queryKey({ planId })
          ),
        ],
      ];
      // update les axes d'un plan
      queryClient.setQueryData(
        trpcClient.plans.plans.get.queryKey({ planId }),
        (old): Plan | undefined =>
          old
            ? {
                ...old,
                axes: old.axes.map((a) => (a.id !== axe.id ? a : axe)),
              }
            : undefined
      );

      // update les axes de la navigation
      queryClient.setQueryData(navigation_key, (old: PlanNode[] | undefined) =>
        old ? old.map((a) => (a.id !== axe.id ? a : axe)) : []
      );
      // update le type d'un plan
      queryClient.setQueryData(plan_type_key, axe.type);

      return previousData;
    },
    onError: (err, axe, previousData: any) => {
      previousData?.forEach(([key, data]: [any, any]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
      });
      queryClient.invalidateQueries({ queryKey: navigation_key });
      queryClient.invalidateQueries({ queryKey: plan_type_key });
    },
  });
};
