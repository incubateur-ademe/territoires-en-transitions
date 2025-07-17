import { trpc } from '@/api/utils/trpc/client';
import { planNodeFactory, sortPlanNodes } from '@/app/plans/plans/utils';
import { AxeType } from '@/backend/plans/fiches/index-domain';
import {
  CreatePlanRequest,
  PlanNode,
} from '@/backend/plans/plans/plans.schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreatePlan = ({
  collectiviteId,
  onSuccess,
  onError,
}: {
  collectiviteId: number;
  onSuccess?: (data: AxeType) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const navigation_key = ['plans_navigation', collectiviteId];

  const { mutateAsync: createPlan } = trpc.plans.plans.create.useMutation();

  const { mutateAsync } = useMutation({
    mutationFn: async (plan: CreatePlanRequest) => {
      const result = await createPlan({
        nom: plan.nom,
        collectiviteId: plan.collectiviteId,
        typeId: plan.typeId,
        referents: plan.referents,
        pilotes: plan.pilotes,
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
      onError?.(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: navigation_key });
    },
    onSuccess: (data) => {
      utils.plans.plans.get.invalidate({
        planId: data.id,
      });
      onSuccess?.(data);
    },
  });

  return {
    mutate: mutateAsync,
  };
};
