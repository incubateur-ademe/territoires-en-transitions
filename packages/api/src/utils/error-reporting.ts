import { getErrorMessage } from '@/domain/utils';
import { getDatadogLogs } from './datadog-logs';
import { getSentry } from './sentry/sentry-client';

const isProd = () => process.env.NODE_ENV === 'production';

export async function reportException(
  error: unknown,
  crashId?: string
): Promise<void> {
  if (!isProd()) return;

  const Sentry = await getSentry();
  if (Sentry) {
    const scope = new Sentry.Scope();
    scope.setTag('crash_id', crashId);
    Sentry.captureException(error, scope);
  }

  const DatadogLogs = await getDatadogLogs();
  DatadogLogs?.logger.error(
    `Reporting error to Sentry: ${getErrorMessage(error)}`
  );
}

export async function getTraceDataSafe() {
  if (!isProd()) return {};

  const Sentry = await getSentry();
  return Sentry?.getTraceData() ?? {};
}

export async function captureRouterTransitionStartSafe(
  href: string,
  navigationType: string
) {
  if (!isProd()) return;

  const Sentry = await getSentry();
  Sentry?.captureRouterTransitionStart(href, navigationType);
}
