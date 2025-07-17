import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Ajoute ou modifie un module du tableau de bord d'une collectivité.
 */
export const useUpsertModule = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.collectivites.tableauDeBord.upsert.mutationOptions({
      onSuccess: ({ id, collectiviteId }) => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.tableauDeBord.list.queryKey({
            collectiviteId,
          }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.tableauDeBord.get.queryKey({
            collectiviteId,
            id,
          }),
        });
      },
    })
  );
};
