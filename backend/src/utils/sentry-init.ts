import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export const SENTRY_DSN = process.env.SENTRY_DSN || '';

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: SENTRY_DSN,
  // See here, node profiling not auto enabled by default
  // https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/integrations/
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
