'use client';

export const ENV = {
  node_env: process.env.NODE_ENV,
  supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_KEY,
  supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  sentry_dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  posthog: {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    env: process.env.NODE_ENV,
  },
};

if (ENV.node_env !== 'test') {
  console.log('ENV :', JSON.stringify(ENV, null, 2));
}
