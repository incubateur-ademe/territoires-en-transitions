import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useOptionalCollectiviteId } from '@tet/api/collectivites';
import { useUserContext } from '@tet/api/users';

const FIVE_MINUTES = 5 * 60_000;

/**
 * Feature flags de l'utilisateur, évalués par le backend plutôt que par
 * posthog-js : l'appel du navigateur vers PostHog peut être bloqué (adblocker,
 * pare-feu de la collectivité), ce qui désactivait les flags en silence.
 *
 * Évalués pour la collectivité courante, celle que `PostHogPageView` pose comme
 * groupe PostHog : la clé de requête la contient, un changement de collectivité
 * recharge donc les flags. Lue sans lever d'erreur, la page pouvant être hors
 * collectivité.
 *
 * Pas de requête sans session : le backend n'évalue aucun flag pour un
 * visiteur non connecté.
 */
export function useListFeatureFlags({ enabled }: { enabled: boolean }) {
  const trpc = useTRPC();
  const { user } = useUserContext();
  const collectiviteId = useOptionalCollectiviteId();

  return useQuery(
    trpc.featureFlags.list.queryOptions(
      { collectiviteId },
      { enabled: enabled && user !== null, staleTime: FIVE_MINUTES }
    )
  );
}
