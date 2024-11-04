export const ENV = {
  node_env: process.env.NODE_ENV,
  logActionsDuration: process.env.NEXT_PUBLIC_LOG_ACTION_DURATION === 'TRUE',
  sentry_dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  posthog: {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    env: process.env.NODE_ENV,
  },
  crisp_website_id: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
};
