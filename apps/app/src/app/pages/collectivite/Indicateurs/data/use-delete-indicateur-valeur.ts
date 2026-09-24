import { invalidateIndicateurValeursQueries } from '@/app/indicateurs/valeurs/invalidate-indicateur-valeurs-queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useDeleteIndicateurValeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.indicateurs.valeurs.delete.mutationOptions({
      onSuccess: async (_, { collectiviteId }) => {
        await invalidateIndicateurValeursQueries({
          queryClient,
          trpc,
          collectiviteId,
        });
      },
      meta: {
        success: 'La valeur a été supprimée',
        error: "La valeur n'a pas pu être supprimée",
      },
    })
  );
};
