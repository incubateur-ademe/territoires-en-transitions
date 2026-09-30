import 'server-only';

import { PostHog } from 'posthog-node';

let client: PostHog | null | undefined;

/**
 * Client PostHog du serveur Next, créé au premier appel : la clé provient de
 * l'environnement du conteneur, connue seulement au runtime. `null` si la clé
 * est absente.
 */
function getClient(): PostHog | null {
  if (client === undefined) {
    const key = process.env.POSTHOG_KEY;
    client = key ? new PostHog(key, { host: process.env.POSTHOG_HOST }) : null;
  }
  return client;
}

/**
 * Remonte une erreur du serveur Next dans l'error tracking PostHog. L'envoi est
 * immédiat, pour ne pas perdre l'erreur si le process s'arrête juste après.
 * Un échec de l'envoi est seulement journalisé : il ne doit ni remplacer
 * l'erreur d'origine, ni devenir un rejet non géré pour les appels en `void`.
 */
export async function captureServerException(
  error: unknown,
  {
    distinctId,
    properties,
  }: { distinctId?: string; properties?: Record<string, unknown> } = {}
) {
  try {
    await getClient()?.captureExceptionImmediate(error, distinctId, properties);
  } catch (sendError) {
    console.warn("Échec de l'envoi de l'erreur à PostHog", sendError);
  }
}

/**
 * Identifiant PostHog de l'utilisateur, lu dans le cookie `ph_<clé>_posthog`
 * posé par posthog-js : relie l'erreur serveur à la personne dans PostHog.
 */
export function getDistinctIdFromCookie(
  cookieHeader: string | undefined
): string | undefined {
  const key = process.env.POSTHOG_KEY;
  if (!key || !cookieHeader) {
    return undefined;
  }

  const name = `ph_${key}_posthog=`;
  const value = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(name))
    ?.slice(name.length);
  if (!value) {
    return undefined;
  }

  try {
    const { distinct_id } = JSON.parse(decodeURIComponent(value));
    return typeof distinct_id === 'string' ? distinct_id : undefined;
  } catch {
    return undefined;
  }
}
