// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { ENV } from '@/api/environmentVariables';
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: ENV.sentry_dsn,
  environment: ENV.node_env,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.25,
});
