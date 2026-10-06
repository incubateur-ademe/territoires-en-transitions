import { ApplicationContext } from '../context/application-context.dto';

/**
 *
 */
export interface Log extends ApplicationContext {
  message?: string;

  /**
   * Rattache le log à la personne dans PostHog Logs (même identifiant que
   * `posthog.identify` côté front). trace_id et span_id sont ajoutés par
   * l'instrumentation OpenTelemetry de pino, cf. telemetry-init.
   */
  posthogDistinctId?: string;
}
