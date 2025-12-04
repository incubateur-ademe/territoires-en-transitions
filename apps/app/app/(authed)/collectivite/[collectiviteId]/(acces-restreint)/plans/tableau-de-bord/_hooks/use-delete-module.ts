import { useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCMutation } from '@tet/api';

/**
 * Supprime un module du tableau de bord d'une collectivité.
 *
 * Utilise useTRPCMutation qui préserve l'inférence automatique des types
 * depuis les endpoints tRPC sans nécessiter d'annotations manuelles.
 */
export const useDeleteModule = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useTRPCMutation(
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
