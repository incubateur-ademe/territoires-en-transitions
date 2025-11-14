import { useTRPC } from '@/api';
import { AxeLight, CreatePlanRequest } from '@/domain/plans';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreatePlan = ({
  collectiviteId,
  onSuccess,
  onError,
}: {
  collectiviteId: number;
  onSuccess?: (data: AxeLight) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: createPlan } = useMutation(
    trpc.plans.plans.create.mutationOptions()
  );

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
    onError: (err) => {
      onError?.(err);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.list.queryKey({
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
