// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { ENV } from '@/api/environmentVariables';
import * as Sentry from '@sentry/nextjs';

function initSentry() {
  if (!ENV.sentry_dsn || !ENV.sentry_dsn.length) {
    return;
  }

  Sentry.init({
    dsn: ENV.sentry_dsn,
    environment: ENV.node_env,

    // Replay may only be enabled for the client-side
    integrations: [Sentry.replayIntegration()],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.25,

    // replay enregistré uniquement en cas d'erreur
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: true,
  });
}

initSentry();

// This export will instrument router navigations, and is only relevant if you enable tracing.
// `captureRouterTransitionStart` is available from SDK version 9.12.0 onwards
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
