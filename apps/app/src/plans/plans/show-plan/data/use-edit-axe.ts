import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { Plan, PlanNode, PlanType } from '@/domain/plans';

/**
 * Édite un axe dans un plan d'action
 */
export const useEditAxe = (planId: number) => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const trpcClient = useTRPC();

  // clés dans le cache
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
      await queryClient.cancelQueries({ queryKey: plan_type_key });

      const previousData = [
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
      queryClient.invalidateQueries({ queryKey: plan_type_key });
    },
  });
};
