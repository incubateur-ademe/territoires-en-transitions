export const ENV = {
  node_env: process.env.NODE_ENV,
  logActionsDuration: process.env.NEXT_PUBLIC_LOG_ACTION_DURATION === 'TRUE',
  supabase_anon_key:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
  supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  sentry_dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  crisp_website_id: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
  app_url: process.env.NEXT_PUBLIC_APP_URL,
  git_short_sha: process.env.NEXT_PUBLIC_GIT_COMMIT_SHORT_SHA,
  git_commit_timestamp: process.env.NEXT_PUBLIC_GIT_COMMIT_TIMESTAMP,
  application_version: process.env.NEXT_PUBLIC_APPLICATION_VERSION,
  application_env: process.env.ENV_NAME || process.env.NEXT_PUBLIC_ENV_NAME,
  deployment_timestamp: process.env.DEPLOYMENT_TIMESTAMP,
};
