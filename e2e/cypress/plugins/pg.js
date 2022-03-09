require('dotenv').config();
const { Pool, Client } = require('pg');

/**
 * Expose le client Postgres afin de pouvoir l'utiliser dans les scénarios de tests
 */
module.exports = (on, config) => {
  const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });

  on('task', {
    pg_query: async ({ query, values }) => {
      const res = await pool.query(query, values);
      return res.rows;
    },
  });
};
