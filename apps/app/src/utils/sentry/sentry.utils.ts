import { ENV } from '@tet/api/environmentVariables';

export const isSentryEnabled =
  ENV.sentry_dsn && ENV.sentry_dsn.length && ENV.node_env === 'production';

export const defaultSentryConfig = {
  dsn: ENV.sentry_dsn,
  environment: ENV.node_env,
  tracesSampleRate: 0.1,
  enableLogs: true,
};
