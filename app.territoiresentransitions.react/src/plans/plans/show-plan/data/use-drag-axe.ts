import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { Plan, PlanNode } from '@/domain/plans/plans';
import { dropAnimation } from '../plan-arborescence.view.tsx';

/**
 * Déplace un axe dans un autre axe
 */
export const useDragAxe = (planId: number) => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const trpcClient = useTRPC();

  const navigation_key = ['plans_navigation', collectivite_id];

  return useMutation({
    mutationFn: async ({
      axe,
      newParentId,
    }: {
      axe: PlanNode;
      newParentId: number;
    }) => {
      const { data, error } = await supabase
        .from('axe')
        .update({ parent: newParentId })
        .eq('id', axe.id);

      return data;
    },
    onMutate: async ({ axe, newParentId }) => {
      await queryClient.cancelQueries({
        queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
      });
      await queryClient.cancelQueries({ queryKey: navigation_key });

      const previousData = [
        [navigation_key, queryClient.getQueryData(navigation_key)],
      ];
      if (planId) {
        previousData.push([
          trpcClient.plans.plans.get.queryKey({ planId }),
          queryClient.getQueryData(
            trpcClient.plans.plans.get.queryKey({ planId })
          ),
        ]);
      }

      queryClient.setQueryData(
        trpcClient.plans.plans.get.queryKey({ planId }),
        (old): Plan | undefined => {
          if (!old) {
            return undefined;
          }
          const updatedAxes = old.axes.map((a) =>
            a.id === axe.id ? { ...a, parent: newParentId } : a
          );
          return {
            ...old,
            axes: updatedAxes,
          };
        }
      );

      queryClient.setQueryData(
        navigation_key,
        (old: PlanNode[] | undefined) => {
          if (old) {
            if (old.some((a) => a.id === axe.id)) {
              return old.filter((a) => a.id !== axe.id);
            } else {
              return [...old, { ...axe, parent: newParentId }];
            }
          } else {
            return [];
          }
        }
      );

      return previousData;
    },
    onError: (err, axe, previousData) => {
      previousData?.forEach(([key, data]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSettled: (data, err, args) => {
      queryClient.invalidateQueries({ queryKey: navigation_key });
      if (planId) {
        queryClient.invalidateQueries({
          queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
        });
        dropAnimation(`axe-${args.axe.id}`);
      }
    },
  });
};
