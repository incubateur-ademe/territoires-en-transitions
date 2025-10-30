import * as Sentry from '@sentry/nextjs';
import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NODE_ENV === 'production') {
    await import('./sentry.server.config');
  }
}

export const onRequestError: Instrumentation.onRequestError = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  Sentry.captureRequestError(...args);
};
