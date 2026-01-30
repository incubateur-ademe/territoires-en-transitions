import { useMutation, useQueryClient } from '@tanstack/react-query';

import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { useTRPC } from '@tet/api';
import { Plan, PlanNode } from '@tet/domain/plans';
import { planNodeFactory, sortPlanNodes } from '../../utils';

export const useUpsertAxe = ({
  parentAxe,
  planId,
  collectiviteId,
  mutationKey,
}: {
  parentAxe: Pick<PlanNode, 'id' | 'depth'>;
  planId: number;
  collectiviteId: number;
  mutationKey?: string[];
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: createAxe } = useMutation(
    trpc.plans.axes.create.mutationOptions()
  );
  const { mutateAsync: updateAxe } = useMutation(
    trpc.plans.axes.update.mutationOptions()
  );

  return useMutation({
    mutationKey,
    mutationFn: (axe: { id?: number; nom: string } | void) => {
      const dataToUpsert = {
        nom: axe?.nom ?? '',
        collectiviteId,
        planId,
        parent: parentAxe.id,
      };

      return axe && 'id' in axe && typeof axe.id === 'number'
        ? updateAxe({
            id: axe.id,
            ...dataToUpsert,
          })
        : createAxe(dataToUpsert);
    },
    meta: { disableToast: true },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: trpc.plans.plans.get.queryKey({ planId }),
      });

      const previousData = {
        queryKey: trpc.plans.plans.get.queryKey({ planId }),
        data: queryClient.getQueryData(
          trpc.plans.plans.get.queryKey({ planId })
        ),
      };

      queryClient.setQueryData(
        trpc.plans.plans.get.queryKey({ planId }),
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
          queryKey: trpc.plans.plans.get.queryKey({ planId }),
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
