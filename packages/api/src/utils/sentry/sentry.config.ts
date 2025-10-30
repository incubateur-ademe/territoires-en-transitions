import { ENV } from '@/api/environmentVariables';

type Sentry = typeof import('@sentry/nextjs');

export const getSentryConfig = (
  Sentry: Sentry
): Parameters<typeof Sentry.init>[0] => ({
  dsn: ENV.sentry_dsn,
  environment: ENV.node_env,
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: 0.25,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  debug: false,
});
