import { ENV } from '../../environmentVariables';
import { getSentryConfig } from './sentry.config';

type Sentry = typeof import('@sentry/nextjs');

let sentrySingleton: Promise<Sentry | null> | null = null;

export async function getSentry(): Promise<Sentry | null> {
  if (!ENV.sentry_dsn || !ENV.sentry_dsn.length) {
    return null;
  }

  if (sentrySingleton) {
    return await sentrySingleton;
  }

  sentrySingleton = (async () => {
    try {
      const Sentry = await import('@sentry/nextjs');
      Sentry.init(getSentryConfig(Sentry));

      return Sentry;
    } catch {
      return null;
    }
  })();

  return sentrySingleton;
}
