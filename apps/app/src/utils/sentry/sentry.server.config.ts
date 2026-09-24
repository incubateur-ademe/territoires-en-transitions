// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import { getDefaultSentryConfig } from './sentry.utils';

Sentry.init({
  ...getDefaultSentryConfig(),
});
