import { useTRPC } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Supprime un module du tableau de bord d'une collectivité.
 */
export const useDeleteModule = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.collectivites.tableauDeBord.delete.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.tableauDeBord.list.queryKey({
            collectiviteId: variables.collectiviteId,
          }),
        });
      },
    })
  );
};
