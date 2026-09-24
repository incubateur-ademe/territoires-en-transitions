import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { invalidateIndicateurValeursQueries } from './invalidate-indicateur-valeurs-queries';

export type UpsertIndicateurValeurInput =
  RouterInput['indicateurs']['valeurs']['upsert'];

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
        success: appLabels.indicateurValeurEnregistree,
        error: appLabels.mutationError,
      },
    })
  );
};
