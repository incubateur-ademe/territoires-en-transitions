import * as Sentry from '@sentry/nestjs';

export const SENTRY_DSN = process.env.SENTRY_DSN || '';

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: SENTRY_DSN,
});
