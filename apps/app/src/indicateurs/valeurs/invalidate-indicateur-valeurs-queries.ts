import type { QueryClient } from '@tanstack/react-query';
import type { useTRPC } from '@tet/api';

type TRPCClient = ReturnType<typeof useTRPC>;

/**
 * Rafraîchit toutes les projections alimentées par une valeur d'indicateur.
 * La promesse ne se résout qu'une fois les requêtes actives rechargées : les
 * éditeurs peuvent alors abandonner leur draft au profit de la valeur serveur
 * normalisée.
 */
export const invalidateIndicateurValeursQueries = async ({
  queryClient,
  trpc,
  collectiviteId,
}: {
  queryClient: QueryClient;
  trpc: TRPCClient;
  collectiviteId: number;
}): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: trpc.indicateurs.indicateurs.list.queryKey({
        collectiviteId,
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: trpc.indicateurs.valeurs.list.queryKey({
        collectiviteId,
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: trpc.indicateurs.valeurs.average.queryKey({
        collectiviteId,
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: trpc.referentiels.actions.getValeursUtilisables.queryKey({
        collectiviteId,
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: trpc.referentiels.actions.getScoreIndicatif.pathKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: trpc.demarches.pcaet.diagnostic.get.pathKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: trpc.demarches.pcaet.get.pathKey(),
    }),
  ]);
};
