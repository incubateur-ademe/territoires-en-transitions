// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { getSentryConfig } from '@/api/utils/sentry/sentry.config';
import * as Sentry from '@sentry/nextjs';

Sentry.init(getSentryConfig(Sentry));
