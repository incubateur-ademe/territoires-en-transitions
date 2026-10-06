import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { initErrorTracking } from './error-tracking/error-tracking.client';

/**
 * Traces et logs OpenTelemetry, envoyés en OTLP à PostHog.
 *
 * À importer avant tout autre module : l'auto-instrumentation (http, express,
 * NestJS, pg, pino…) patche les modules au moment de leur chargement. Les
 * logs pino partent via @opentelemetry/instrumentation-pino, qui y ajoute
 * aussi trace_id et span_id.
 *
 * La configuration passe par les variables OTEL_* standard. Rien ne démarre
 * sans OTEL_EXPORTER_OTLP_ENDPOINT (pour PostHog EU :
 * https://eu.i.posthog.com/i, les exporters ajoutent /v1/traces et /v1/logs).
 */
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  const defaults: Record<string, string> = {
    // PostHog ne reçoit que les traces et les logs
    OTEL_METRICS_EXPORTER: 'none',
    // Format des exemples de la doc PostHog
    OTEL_EXPORTER_OTLP_PROTOCOL: 'http/json',
    // 10 % des traces, en suivant la décision de l'appelant s'il y en a une
    OTEL_TRACES_SAMPLER: 'parentbased_traceidratio',
    OTEL_TRACES_SAMPLER_ARG: '0.1',
  };
  for (const [name, value] of Object.entries(defaults)) {
    process.env[name] ??= value;
  }

  // PostHog authentifie l'OTLP avec la clé publique du projet (phc_…)
  if (!process.env.OTEL_EXPORTER_OTLP_HEADERS && process.env.POSTHOG_KEY) {
    process.env.OTEL_EXPORTER_OTLP_HEADERS = `Authorization=Bearer ${process.env.POSTHOG_KEY}`;
  }

  const sdk = new NodeSDK({
    instrumentations: [
      getNodeAutoInstrumentations({
        // Une span par accès disque : bruit sans valeur, et coûteux
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
  sdk.start();

  // Les traces et logs partent par lots : sans flush à l'arrêt (redéploiement),
  // le dernier lot, souvent celui qui entoure une erreur, serait perdu. Le
  // signal est ensuite relancé pour garder l'arrêt par défaut du process.
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
      sdk
        .shutdown()
        .catch(() => undefined)
        .finally(() => process.kill(process.pid, signal));
    });
  }
}

// Error tracking PostHog, avec autocapture des erreurs non gérées : à créer
// avant le bootstrap pour couvrir aussi un échec au démarrage.
initErrorTracking();
