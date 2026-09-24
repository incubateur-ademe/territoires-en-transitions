import * as Sentry from '@sentry/nextjs';
import { validateRuntimeEnv } from './src/utils/runtime-env/validate-runtime-env';
import { isSentryEnabled } from './src/utils/sentry/sentry.utils';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateRuntimeEnv();
  }

  if (!isSentryEnabled()) {
    return;
  }

  await import('./src/utils/sentry/sentry.server.config');
}

// Toujours défini, mais inerte tant que Sentry n'est pas activé : le DSN n'est
// connu qu'au runtime, on ne peut plus trancher au chargement du module.
export const onRequestError: typeof Sentry.captureRequestError = (...args) => {
  if (!isSentryEnabled()) {
    return;
  }

  return Sentry.captureRequestError(...args);
};
