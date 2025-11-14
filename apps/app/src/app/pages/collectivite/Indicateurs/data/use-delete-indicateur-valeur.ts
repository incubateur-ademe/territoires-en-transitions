import { useTRPC } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteIndicateurValeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.indicateurs.valeurs.delete.mutationOptions({
      onSuccess: (_, variables) => {
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
      meta: {
        success: 'La valeur a été supprimée',
        error: "La valeur n'a pas pu être supprimée",
      },
    })
  );
};
