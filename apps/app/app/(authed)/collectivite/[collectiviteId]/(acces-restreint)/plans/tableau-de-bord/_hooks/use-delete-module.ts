import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Supprime un module du tableau de bord d'une collectivité.
 */
export const useDeleteModule = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.metrics.collectivites.deleteModule.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.metrics.collectivites.listModules.queryKey({
            collectiviteId: variables.collectiviteId,
          }),
        });
      },
    })
  );
};
