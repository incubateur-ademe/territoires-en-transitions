import { useTRPC } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Charge les étapes d'une fiche action
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
