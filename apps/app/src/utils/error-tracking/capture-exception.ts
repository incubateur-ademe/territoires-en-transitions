import { getPublicEnv } from '@tet/api/public-env';
import posthog from 'posthog-js';

/**
 * Initialise PostHog au minimum si `PostHogProvider` ne l'a pas fait : sans
 * ça, posthog-js ignorerait l'erreur. C'est justement le cas de
 * `global-error.tsx` quand le layout racine plante avant le provider (par
 * exemple dans `SupabaseProvider` ou `UserProvider`, rendus au-dessus de lui).
 *
 * Persistance en mémoire seulement, faute de pouvoir lire le consentement, et
 * aucune capture automatique : le client ne sert qu'à envoyer cette erreur.
 */
function ensureInitialized() {
  if (posthog.__loaded) {
    return;
  }
  const { POSTHOG_KEY, POSTHOG_HOST } = getPublicEnv();
  if (!POSTHOG_KEY) {
    return;
  }
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    persistence: 'memory',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
  });
}

/**
 * Remonte une erreur navigateur dans l'error tracking PostHog. Sans effet si
 * la clé PostHog est absente.
 *
 * `crashId` est l'identifiant affiché à l'utilisateur sur la page d'erreur : il
 * permet de retrouver l'exception à partir d'une capture d'écran.
 */
export function captureException({
  error,
  crashId,
}: {
  error: unknown;
  crashId?: string;
}) {
  ensureInitialized();
  posthog.captureException(error, crashId ? { crash_id: crashId } : undefined);
}
