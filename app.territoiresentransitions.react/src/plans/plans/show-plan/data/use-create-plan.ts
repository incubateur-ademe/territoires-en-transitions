import { trpc, useTRPC } from '@/api/utils/trpc/client';
import { AxeType } from '@/domain/plans/fiches';
import { CreatePlanRequest } from '@/domain/plans/plans';
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
  const trpcClient = useTRPC();

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
    onError: (err, axe, context) => {
      onError?.(err);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: trpcClient.plans.plans.list.queryKey({
          collectiviteId,
        }),
      });
      onSuccess?.(data);
    },
  });

  return {
    mutate: mutateAsync,
  };
};
