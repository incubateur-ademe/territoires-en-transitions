import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { AxeLight } from '@tet/domain/plans';

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
    mutationFn: async (plan: Parameters<typeof createPlan>[0]) => {
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
