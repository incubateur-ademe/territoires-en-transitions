import { trpc, useTRPC } from '@/api/utils/trpc/client';
import { planNodeFactory, sortPlanNodes } from '@/app/plans/plans/utils';
import { PlanNode, UpdatePlanRequest } from '@/domain/plans/plans';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdatePlan = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const queryClient = useQueryClient();
  const trpcClient = useTRPC();
  const navigation_key = ['plans_navigation', collectiviteId];

  const { mutateAsync: updatePlanMutation } =
    trpc.plans.plans.update.useMutation();

  const { mutateAsync } = useMutation({
    mutationFn: async (plan: UpdatePlanRequest) => {
      const result = await updatePlanMutation({
        id: plan.id,
        nom: plan.nom || '',
        collectiviteId: plan.collectiviteId,
        typeId: plan.typeId || undefined,
        referents: plan.referents || undefined,
        pilotes: plan.pilotes || undefined,
      });
      return result;
    },
    meta: { disableToast: true },
    onMutate: async ({ nom }) => {
      await queryClient.cancelQueries({ queryKey: navigation_key });

      const previousData: PlanNode[] | undefined =
        queryClient.getQueryData(navigation_key);

      queryClient.setQueryData(
        navigation_key,
        (old: PlanNode[] | undefined) => {
          if (old) {
            const axe = planNodeFactory({
              collectiviteId,
              axes: old,
              nom,
            });
            const tempNavigation = [...old, axe];
            sortPlanNodes(tempNavigation);
            return tempNavigation;
          } else {
            return [];
          }
        }
      );

      return previousData;
    },
    onError: (err, axe, context) => {
      queryClient.setQueryData(navigation_key, context);
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: navigation_key });

      await queryClient.invalidateQueries({
        queryKey: trpcClient.plans.plans.get.queryKey({ planId: data.id }),
      });
      /**
       * to handle case where "libreTags" are renamed and some fiches might depend on the
       */
      await queryClient.invalidateQueries({
        queryKey: trpcClient.plans.fiches.listResumes.queryKey({
          collectiviteId,
        }),
      });
      await queryClient.invalidateQueries({
        queryKey: trpcClient.plans.plans.list.queryKey({
          collectiviteId,
        }),
      });
    },
  });

  return {
    mutate: mutateAsync,
  };
};
