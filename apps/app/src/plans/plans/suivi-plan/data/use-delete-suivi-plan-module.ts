import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useDeleteSuiviPlanModule = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.suivi.deleteModule.mutationOptions({
      onSuccess: (_, { planId }) =>
        queryClient.invalidateQueries({
          queryKey: trpc.plans.suivi.listModules.queryKey({ planId }),
        }),
    })
  );
};
