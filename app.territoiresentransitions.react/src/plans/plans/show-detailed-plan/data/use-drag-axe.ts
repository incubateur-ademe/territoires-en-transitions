import { useMutation, useQueryClient } from 'react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { PlanNode } from '../../types';
import { dropAnimation } from '../plan-arborescence.view.tsx';

/**
 * Déplace un axe dans un autre axe
 */
export const useDragAxe = (planId: number) => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const flat_axes_key = ['flat_axes', planId];
  const navigation_key = ['plans_navigation', collectivite_id];

  return useMutation(
    async ({ axe, newParentId }: { axe: PlanNode; newParentId: number }) => {
      await supabase
        .from('axe')
        .update({ parent: newParentId })
        .eq('id', axe.id);
    },
    {
      onMutate: async ({ axe, newParentId }) => {
        await queryClient.cancelQueries({ queryKey: flat_axes_key });
        await queryClient.cancelQueries({ queryKey: navigation_key });

        const previousData = [
          [flat_axes_key, queryClient.getQueryData(flat_axes_key)],
          [navigation_key, queryClient.getQueryData(navigation_key)],
        ];

        queryClient.setQueryData(
          flat_axes_key,
          (old: PlanNode[] | undefined) => {
            if (old) {
              return old.map((a) =>
                a.id === axe.id ? { ...a, parent: newParentId } : a
              );
            } else {
              return [];
            }
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
        queryClient.invalidateQueries(navigation_key);
        queryClient.invalidateQueries(flat_axes_key).then(() => {
          dropAnimation(`axe-${args.axe.id}`);
        });
      },
    }
  );
};
