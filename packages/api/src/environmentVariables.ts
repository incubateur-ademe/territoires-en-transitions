export const ENV = {
  node_env: process.env.NODE_ENV,
  logActionsDuration: process.env.NEXT_PUBLIC_LOG_ACTION_DURATION === 'TRUE',
  supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_KEY,
  supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  sentry_dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  app_url: process.env.NEXT_PUBLIC_APP_URL,
  auth_url: process.env.NEXT_PUBLIC_AUTH_URL,
  panier_url: process.env.NEXT_PUBLIC_PANIER_URL,
  backend_url: process.env.NEXT_PUBLIC_BACKEND_URL,
  posthog: {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    env: process.env.NODE_ENV,
  },
  crisp_website_id: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
};
