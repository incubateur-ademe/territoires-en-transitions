import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { trpc, useTRPC } from '@/api/utils/trpc/client';
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
  const trpcClient = useTRPC();
  const navigation_key = ['plans_navigation', collectivite_id];

  const { mutateAsync: createAxe } = trpc.plans.plans.createAxe.useMutation();
  const { mutateAsync: updateAxe } = trpc.plans.plans.updateAxe.useMutation();
  return useMutation({
    mutationFn: async (axe: TAxeInsert) => {
      if (axe.id) {
        const result = await updateAxe({
          id: axe.id,
          nom: axe.nom || 'Axe sans titre',
          collectiviteId: axe.collectivite_id,
          planId,
          parent: parentAxe.id,
        });
        return result;
      } else {
        const result = await createAxe({
          nom: axe.nom || 'Axe sans titre',
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
        queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
      });
      await queryClient.cancelQueries({ queryKey: navigation_key });

      const previousData = [
        [navigation_key, queryClient.getQueryData(navigation_key)],
        [
          trpcClient.plans.plans.get.queryKey({ planId }),
          queryClient.getQueryData(
            trpcClient.plans.plans.get.queryKey({ planId })
          ),
        ],
      ];

      queryClient.setQueryData(
        trpcClient.plans.plans.get.queryKey({ planId }),
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

      queryClient.setQueryData(
        navigation_key,
        (old: PlanNode[] | undefined) => {
          if (old) {
            const axe = planNodeFactory({
              collectiviteId: collectivite_id,
              axes: old,
              parentId: parentAxe.id,
              parentDepth: parentAxe.depth + 1,
            });
            const tempAxes = [...old, axe];
            sortPlanNodes(tempAxes);
            return tempAxes;
          } else {
            return [];
          }
        }
      );

      return previousData;
    },
    onError: (err, axe, context) => {
      context?.forEach(([key, data]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: navigation_key }),
        queryClient.invalidateQueries({
          queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
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
