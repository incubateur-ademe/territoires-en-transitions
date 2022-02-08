export const ENV = {
  node_env: process.env.NODE_ENV,
  logActionsDuration: process.env.REACT_APP_LOG_ACTION_DURATION === 'TRUE',
  supabase_anon_key: process.env.REACT_APP_SUPABASE_KEY,
  supabase_url: process.env.REACT_APP_SUPABASE_URL,
};

console.log(
  'process.env.REACT_APP_SUPABASE_URL : ',
  process.env.REACT_APP_SUPABASE_URL
);
console.log('ENV :', JSON.stringify(ENV, null, 2));
