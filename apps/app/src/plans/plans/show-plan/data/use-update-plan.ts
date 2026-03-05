import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useUpdatePlan = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: updatePlanMutation } = useMutation(
    trpc.plans.plans.update.mutationOptions()
  );

  const { mutateAsync } = useMutation({
    mutationFn: updatePlanMutation,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.get.queryKey({ planId: data.id }),
      });
      /**
       * to handle case where "libreTags" are renamed and some fiches might depend on the
       */
      await queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listFiches.queryKey({
          collectiviteId,
        }),
      });
      await queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.list.queryKey({
          collectiviteId,
        }),
      });
    },
  });

  const updatePlan = async (
    ...args: Parameters<typeof mutateAsync>
  ): Promise<boolean> => {
    try {
      await mutateAsync(...args);
      return true;
    } catch {
      return false;
    }
  };

  return {
    mutate: updatePlan,
  };
};
