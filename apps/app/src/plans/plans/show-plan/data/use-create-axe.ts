import { useMutation, useQueryClient } from '@tanstack/react-query';

import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { useTRPC } from '@tet/api';
import { Plan, PlanNode } from '@tet/domain/plans';
import { planNodeFactory, sortPlanNodes } from '../../utils';
import { AxeCreatedEvent } from '../plan-arborescence.view/axe/axe.context';

export const useCreateAxe = ({
  collectiviteId,
  parentAxe,
  planId,
}: {
  collectiviteId: number;
  parentAxe: Pick<PlanNode, 'id' | 'depth'>;
  planId: number;
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: createAxe } = useMutation(
    trpc.plans.axes.create.mutationOptions()
  );

  return useMutation({
    mutationFn: () => {
      return createAxe({
        collectiviteId,
        nom: '',
        planId,
        parent: parentAxe.id,
      });
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
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.indicateurs.list.queryKey({
            filters: { axeIds: [data.id] },
          }),
        }),
      ]);
      await waitForMarkup(`#axe-${data.id}`).then(() => {
        // émet un événement pour signaler que le nouvel axe a été créé
        // (va déclencher le passage en mode édition du titre)
        const event = new CustomEvent(AxeCreatedEvent, {
          detail: { axeId: data.id },
        });
        window.dispatchEvent(event);
      });
    },
  });
};
