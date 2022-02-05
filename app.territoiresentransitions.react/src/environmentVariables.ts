export const ENV = {
  node_env: process.env.NODE_ENV,
  logActionsDuration: process.env.REACT_APP_LOG_ACTION_DURATION === 'TRUE',
  supabase_anon_key:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNzIwODU0MCwiZXhwIjoxOTc0MzYzNzQwfQ.zcaQfHd3VA7XgJmdGfmV86OLVJT9s2MTmSy-e69BpUY', //process.env.REACT_APP_SUPABASE_KEY,
  supabase_url: process.env.REACT_APP_SUPABASE_URL,
};

console.log(
  'process.env.REACT_APP_SUPABASE_URL : ',
  process.env.REACT_APP_SUPABASE_URL
);
console.log('ENV :', JSON.stringify(ENV, null, 2));
