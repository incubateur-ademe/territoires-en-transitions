import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { TAxeInsert } from '@/app/types/alias';
import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { Plan, PlanNode } from '@/domain/plans/plans';
import { planNodeFactory, sortPlanNodes } from '../../utils';

export const useUpsertAxe = ({
  parentAxe,
  planId,
}: {
  parentAxe: Pick<PlanNode, 'id' | 'depth'>;
  planId: number;
}) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const trpc = useTRPC();

  const { mutateAsync: createAxe } = useMutation(
    trpc.plans.plans.createAxe.mutationOptions()
  );
  const { mutateAsync: updateAxe } = useMutation(
    trpc.plans.plans.updateAxe.mutationOptions()
  );
  return useMutation({
    mutationFn: async (axe: TAxeInsert) => {
      if (axe.id) {
        const result = await updateAxe({
          id: axe.id,
          nom: axe.nom ?? '',
          collectiviteId: axe.collectivite_id,
          planId,
          parent: parentAxe.id,
        });
        return result;
      } else {
        const result = await createAxe({
          nom: axe.nom ?? '',
          collectiviteId: axe.collectivite_id,
          planId,
          parent: parentAxe.id,
        });
        return result;
      }
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
            collectiviteId: collectivite_id,
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
