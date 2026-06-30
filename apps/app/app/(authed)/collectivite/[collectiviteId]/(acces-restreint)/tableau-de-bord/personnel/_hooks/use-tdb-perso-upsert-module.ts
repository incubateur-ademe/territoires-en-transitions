import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Crée ou met à jour un module du tableau de bord personnel de l'utilisateur
 * courant.
 *
 * L'invalidation du cache est laissée à l'appelant (via `keysToInvalidate`) afin
 * de conserver la compatibilité avec les clés de cache existantes.
 */
export const useUpsertModuleTdbPerso = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.metrics.users.upsertModule.mutationOptions()
  );
};
