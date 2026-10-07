import { ENV } from '@tet/api/environmentVariables';

/**
 * Fonctions et non constantes : le DSN provient désormais de l'environnement du
 * conteneur (cf. `@tet/api/public-env`). Des `const` au niveau module seraient
 * évaluées au chargement, donc potentiellement avant que la configuration
 * runtime ne soit disponible.
 */
export const isSentryEnabled = () =>
  Boolean(ENV.sentry_dsn?.length) && ENV.node_env === 'production';

export const getDefaultSentryConfig = () => ({
  dsn: ENV.sentry_dsn,
  environment: ENV.node_env,
  tracesSampleRate: 0.1,
  enableLogs: true,
});
