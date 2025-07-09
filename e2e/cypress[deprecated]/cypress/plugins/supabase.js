require('dotenv').config();
const {createClient} = require('@supabase/supabase-js');

/**
 * Expose le client Supabase afin de pouvoir l'utiliser dans les scénarios de tests
 */
module.exports = (on, config) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  on('task', {
    supabase_rpc: async ({name, params}) => {
      const res = await supabase.rpc(name, params);
      return res || null;
    },
    supabase_select: async ({table, columns, match}) => {
      const res = await supabase.from(table).select(columns).match(match);
      return res || null;
    },
    supabase_insert: async ({table, values, columns}) => {
      const query = supabase.from(table).insert(values);
      if (typeof columns === 'string') query.select(columns);
      const res = await query;
      return res || null;
    },
    supabase_generateLink: async ({type, email}) => {
      const res = await supabase.auth.api.generateLink(type, email);
      return res || null;
    },
  });
};
