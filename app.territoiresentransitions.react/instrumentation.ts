import * as Sentry from '@sentry/nextjs';

export async function register() {
  await import('./src/lib/sentry.server.config');
}

export const onRequestError = Sentry.captureRequestError;
