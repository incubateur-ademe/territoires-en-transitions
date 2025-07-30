import { trpc, useTRPC } from '@/api/utils/trpc/client';
import { UpdatePlanRequest } from '@/domain/plans/plans';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdatePlan = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const queryClient = useQueryClient();
  const trpcClient = useTRPC();

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
    onSuccess: async (data) => {
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
