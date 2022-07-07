require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

/**
 * Expose le client Supabase afin de pouvoir l'utiliser dans les scénarios de tests
 */
module.exports = (on, config) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  on('task', {
    supabase_rpc: async ({ name, params }) => {
      const res = await supabase.rpc(name, params);
      return res || null;
    },
  });
};
