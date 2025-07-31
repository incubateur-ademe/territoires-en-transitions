import { ApplicationContext } from '@/backend/utils/context/application-context.dto';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export const SENTRY_DSN = process.env.SENTRY_DSN || '';

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: SENTRY_DSN,
  // See here, node profiling not auto enabled by default
  // https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/integrations/
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

export const getSentryContextFromApplicationContext = (
  context: ApplicationContext,
  extraTags?: { [key: string]: number | string | boolean | null | undefined }
): Sentry.Scope => {
  const scopeContext = new Sentry.Scope();
  scopeContext.setTag('source', context.source);
  scopeContext.setTag('service', context.service);
  scopeContext.setTag('version', context.version);
  scopeContext.setTag('environment', context.environment);
  scopeContext.setTag('correlation_id', context.correlationId);
  if (context?.userId) {
    scopeContext.setUser({ id: context.userId });
  }
  if (context.requestPath) {
    scopeContext.setTransactionName(context.requestPath);
  }
  scopeContext.setTags(context.scope as any);
  if (extraTags) {
    scopeContext.setTags(extraTags);
  }

  return scopeContext;
};
