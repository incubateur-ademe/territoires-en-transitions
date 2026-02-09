import * as Sentry from '@sentry/nextjs';
import { isSentryEnabled } from './src/utils/sentry/sentry.utils';

export async function register() {
  if (!isSentryEnabled) {
    return;
  }

  await import('./src/utils/sentry/sentry.server.config');
}

export const onRequestError = isSentryEnabled
  ? Sentry.captureRequestError
  : undefined;
