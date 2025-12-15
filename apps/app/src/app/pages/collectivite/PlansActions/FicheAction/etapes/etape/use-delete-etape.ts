import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Charge les étapes d'une fiche
 */
export const useDeleteEtape = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.fiches.etapes.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.etapes.list.queryKey(),
        });
      },
    })
  );
};
