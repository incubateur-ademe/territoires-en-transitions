import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { PlanNode } from '@/domain/plans';
import { dropAnimation } from '../plan-arborescence.view';

/**
 * Déplace un axe dans un autre axe
 */
export const useDragAxe = (planId: number) => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const trpcClient = useTRPC();

  return useMutation({
    mutationFn: async ({
      axe,
      newParentId,
    }: {
      axe: PlanNode;
      newParentId: number;
    }) => {
      const { data } = await supabase
        .from('axe')
        .update({ parent: newParentId })
        .eq('id', axe.id);

      return data;
    },
    onSettled: (data, err, args) => {
      if (planId) {
        queryClient.invalidateQueries({
          queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
        });
        dropAnimation(`axe-${args.axe.id}`);
      }
    },
  });
};
