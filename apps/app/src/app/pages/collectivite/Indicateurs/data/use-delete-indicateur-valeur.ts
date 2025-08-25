import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteIndicateurValeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.indicateurs.valeurs.delete.mutationOptions({
      onSuccess: (data, variables) => {
        const { collectiviteId, indicateurId } = variables;
        if (collectiviteId && indicateurId) {
          // recharge les infos complémentaires associées à l'indicateur
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.definitions.list.queryKey({
              collectiviteId,
            }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.referentiels.actions.getValeursUtilisables.queryKey({
              collectiviteId,
            }),
          });
        }
      },
    })
  );
};
