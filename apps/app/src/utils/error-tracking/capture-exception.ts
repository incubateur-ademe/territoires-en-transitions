import posthog from 'posthog-js';

/**
 * Remonte une erreur navigateur dans l'error tracking PostHog. Sans effet tant
 * que PostHog n'est pas initialisé (clé absente), cf. `PostHogProvider`.
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
  posthog.captureException(error, crashId ? { crash_id: crashId } : undefined);
}
