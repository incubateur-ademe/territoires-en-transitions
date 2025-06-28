import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSetValeursUtilisees() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.actions.setValeursUtilisees.mutationOptions({
      onSuccess: (data, { collectiviteId, actionId }) => {
        const input = {
          collectiviteId,
          actionIds: [actionId],
        };
        queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.actions.getValeursUtilisees.queryKey(input),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.actions.getValeursUtilisables.queryKey(input),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.getScoreIndicatif.queryKey(input),
        });
      },
    })
  );
}
