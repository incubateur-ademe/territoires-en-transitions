import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { invalidateIndicateurValeursQueries } from './invalidate-indicateur-valeurs-queries';

export const useUpsertIndicateurValeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.indicateurs.valeurs.upsert.mutationOptions({
      onSuccess: async (_, { collectiviteId }) => {
        await invalidateIndicateurValeursQueries({
          queryClient,
          trpc,
          collectiviteId,
        });
      },
      meta: {
        success: appLabels.mutationSuccess,
        error: appLabels.mutationError,
      },
    })
  );
};
