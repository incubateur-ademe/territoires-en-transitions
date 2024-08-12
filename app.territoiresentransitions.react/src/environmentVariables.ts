export const ENV = {
  node_env: process.env.NODE_ENV,
  logActionsDuration:
    process.env.NX_PUBLIC_REACT_APP_LOG_ACTION_DURATION === 'TRUE',
  supabase_anon_key: process.env.NX_PUBLIC_REACT_APP_SUPABASE_KEY,
  supabase_url: process.env.NX_PUBLIC_REACT_APP_SUPABASE_URL,
  sentry_dsn: process.env.NX_PUBLIC_REACT_APP_SENTRY_DSN,
  posthog: {
    host: process.env.NX_PUBLIC_REACT_APP_POSTHOG_HOST,
    key: process.env.NX_PUBLIC_REACT_APP_POSTHOG_KEY,
    env: process.env.NODE_ENV,
  },
};

if (ENV.node_env !== 'test') {
  console.log('ENV :', JSON.stringify(ENV, null, 2));
}
