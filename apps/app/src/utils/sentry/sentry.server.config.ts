// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import { defaultSentryConfig } from './sentry.utils';

Sentry.init({
  ...defaultSentryConfig,
});
