import { useMutation, useQueryClient } from '@tanstack/react-query';

import { TAxeInsert } from '@/app/types/alias';
import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { useTRPC } from '@tet/api';
import { Plan, PlanNode } from '@tet/domain/plans';
import { planNodeFactory, sortPlanNodes } from '../../utils';

export const useUpsertAxe = ({
  parentAxe,
  planId,
  mutationKey,
}: {
  parentAxe: Pick<PlanNode, 'id' | 'depth'>;
  planId: number;
  mutationKey?: string[];
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: upsertAxe } = useMutation(
    trpc.plans.axes.upsert.mutationOptions()
  );
  return useMutation({
    mutationKey,
    mutationFn: async (axe: TAxeInsert) => {
      return await upsertAxe({
        id: axe.id,
        nom: axe.nom ?? '',
        collectiviteId: axe.collectivite_id,
        planId,
        parent: parentAxe.id,
      });
    },
    meta: { disableToast: true },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: trpc.plans.get.queryKey({ planId }),
      });

      const previousData = {
        queryKey: trpc.plans.get.queryKey({ planId }),
        data: queryClient.getQueryData(trpc.plans.get.queryKey({ planId })),
      };

      queryClient.setQueryData(
        trpc.plans.get.queryKey({ planId }),
        (old): Plan | undefined => {
          if (!old) {
            return undefined;
          }
          const axe = planNodeFactory({
            axes: old.axes,
            parentId: parentAxe.id,
            parentDepth: parentAxe.depth + 1,
          });

          return { ...old, axes: sortPlanNodes([...old.axes, axe]) };
        }
      );

      return previousData;
    },
    onError: (err, axe, context) => {
      if (context?.queryKey && context?.data) {
        queryClient.setQueryData(context.queryKey, context.data);
      }
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.plans.get.queryKey({ planId }),
        }),
      ]);
      await waitForMarkup(`#axe-${data.id}`).then((el) => {
        // scroll au niveau du nouvel axe créé
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // donne le focus à son titre
        document.getElementById(`axe-titre-${data.id}`)?.focus();
      });
    },
  });
};
