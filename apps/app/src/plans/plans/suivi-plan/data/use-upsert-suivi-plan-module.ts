import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useUpsertSuiviPlanModule = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.suivi.upsertModule.mutationOptions({
      onSuccess: ({ planId }) =>
        queryClient.invalidateQueries({
          queryKey: trpc.plans.suivi.listModules.queryKey({ planId }),
        }),
    })
  );
};
