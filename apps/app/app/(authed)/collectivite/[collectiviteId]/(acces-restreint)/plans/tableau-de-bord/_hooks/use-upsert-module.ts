import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Ajoute ou modifie un module du tableau de bord d'une collectivité.
 */
export const useUpsertModule = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.metrics.collectivites.upsertModule.mutationOptions({
      onSuccess: ({ id, collectiviteId }) => {
        queryClient.invalidateQueries({
          queryKey: trpc.metrics.collectivites.listModules.queryKey({
            collectiviteId,
          }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.metrics.collectivites.getModule.queryKey({
            collectiviteId,
            id,
          }),
        });
      },
    })
  );
};
