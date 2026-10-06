import { Logger } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { ApplicationContext } from '@tet/backend/utils/context/application-context.dto';
import { getErrorMessage } from '@tet/domain/utils';
import { getErrorTrackingClient } from './error-tracking.client';

type ExtraProperties = {
  [key: string]: number | string | boolean | null | undefined;
};

const logger = new Logger('CaptureException');

/**
 * Remonte une erreur serveur dans l'error tracking PostHog, avec le contexte
 * de la requête ou du job : l'utilisateur, le service, la version,
 * l'environnement, l'identifiant de corrélation des logs et la trace
 * OpenTelemetry en cours.
 *
 * L'envoi est immédiat et n'est pas attendu : l'erreur n'est pas perdue si le
 * process s'arrête, et l'appelant n'est pas ralenti.
 */
export function captureException(
  exception: unknown,
  context: ApplicationContext,
  extraProperties?: ExtraProperties
) {
  getErrorTrackingClient()
    ?.captureExceptionImmediate(exception, context.userId, {
      ...context.scope,
      ...extraProperties,
      source: context.source,
      service: context.service,
      version: context.version,
      environment: context.environment,
      correlation_id: context.correlationId,
      trace_id: trace.getActiveSpan()?.spanContext().traceId,
      $request_path: context.requestPath,
    })
    .catch((error) =>
      logger.warn(
        `Échec de l'envoi de l'erreur à PostHog : ${getErrorMessage(error)}`
      )
    );
}
