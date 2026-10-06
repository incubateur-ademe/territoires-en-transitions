import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null | undefined;

function createClient({
  enableExceptionAutocapture,
}: {
  enableExceptionAutocapture: boolean;
}): PostHog | null {
  const key = process.env.POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST;
  return key && host
    ? new PostHog(key, { host, enableExceptionAutocapture })
    : null;
}

/**
 * Crée le client d'error tracking avec l'autocapture des erreurs non gérées.
 * Appelé par `telemetry-init.ts`, avant le bootstrap NestJS : un échec au
 * démarrage (port déjà pris, module qui ne s'initialise pas) remonte aussi,
 * comme toute erreur levée hors d'une requête. Sur une exception non attrapée
 * ou un rejet non géré, posthog-node envoie l'erreur puis arrête le process
 * avec le code 1, comme Node par défaut.
 *
 * Ce module n'importe rien de NestJS : il est chargé avant
 * l'auto-instrumentation OpenTelemetry.
 */
export function initErrorTracking() {
  posthogClient ??= createClient({ enableExceptionAutocapture: true });
}

/**
 * Client PostHog dédié à l'error tracking, `null` si POSTHOG_KEY ou
 * POSTHOG_HOST manque. Il vit hors de l'injection de dépendances (d'où
 * process.env plutôt que ConfigurationService).
 *
 * Sans `initErrorTracking()` préalable (tests), le client est créé au premier
 * appel, sans autocapture : il ne pose pas d'écouteur sur le process.
 */
export function getErrorTrackingClient(): PostHog | null {
  if (posthogClient === undefined) {
    posthogClient = createClient({ enableExceptionAutocapture: false });
  }
  return posthogClient;
}
