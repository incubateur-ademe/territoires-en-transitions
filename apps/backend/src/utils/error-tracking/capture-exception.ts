import * as Sentry from '@sentry/nestjs';
import { ApplicationContext } from '@tet/backend/utils/context/application-context.dto';
import { getSentryContextFromApplicationContext } from '@tet/backend/utils/sentry-init';
import { getErrorMessage } from '@tet/domain/utils';
import { Logger } from '@nestjs/common';
import { PostHog } from 'posthog-node';

type ExtraTags = { [key: string]: number | string | boolean | null | undefined };

const logger = new Logger('CaptureException');

let posthogClient: PostHog | null | undefined;

/**
 * Client PostHog dédié à l'error tracking, créé au premier appel. Comme pour
 * Sentry (cf. sentry-init), il vit hors de l'injection de dépendances : le
 * filtre d'exceptions global est instancié à la main dans main.ts. `null` si
 * POSTHOG_KEY ou POSTHOG_HOST manque.
 */
function getPostHogClient(): PostHog | null {
  if (posthogClient === undefined) {
    const key = process.env.POSTHOG_KEY;
    const host = process.env.POSTHOG_HOST;
    posthogClient = key && host ? new PostHog(key, { host }) : null;
  }
  return posthogClient;
}

/**
 * Remonte une erreur serveur dans Sentry et dans l'error tracking PostHog, avec
 * le contexte de la requête ou du job : l'utilisateur, le service, la version,
 * l'environnement et l'identifiant de corrélation des logs.
 *
 * L'envoi à PostHog est immédiat et n'est pas attendu : l'erreur n'est pas
 * perdue si le process s'arrête, et l'appelant n'est pas ralenti.
 */
export function captureException(
  exception: unknown,
  context: ApplicationContext,
  extraTags?: ExtraTags
) {
  Sentry.captureException(
    exception,
    getSentryContextFromApplicationContext(context, extraTags)
  );

  getPostHogClient()
    ?.captureExceptionImmediate(exception, context.userId, {
      ...context.scope,
      ...extraTags,
      source: context.source,
      service: context.service,
      version: context.version,
      environment: context.environment,
      correlation_id: context.correlationId,
      $request_path: context.requestPath,
    })
    .catch((error) =>
      logger.warn(
        `Échec de l'envoi de l'erreur à PostHog : ${getErrorMessage(error)}`
      )
    );
}
