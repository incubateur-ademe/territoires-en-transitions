export const ENV = {
  node_env: process.env.NODE_ENV,
  logActionsDuration: process.env.NX_PUBLIC_LOG_ACTION_DURATION === 'TRUE',
  supabase_anon_key: process.env.NX_PUBLIC_SUPABASE_KEY,
  supabase_url: process.env.NX_PUBLIC_SUPABASE_URL,
  sentry_dsn: process.env.NX_PUBLIC_SENTRY_DSN,
  panier_url: process.env.NX_PUBLIC_PANIER_URL,
  posthog: {
    host: process.env.NX_PUBLIC_POSTHOG_HOST,
    key: process.env.NX_PUBLIC_POSTHOG_KEY,
    env: process.env.NODE_ENV,
  },
};

if (ENV.node_env !== 'test') {
  console.log('ENV :', JSON.stringify(ENV, null, 2));
}
