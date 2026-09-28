import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export function getDatabase(applicationName: string): {
  db: NodePgDatabase;
  pool: Pool;
} {
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'SUPABASE_DATABASE_URL is required.\n' +
        'Example: export SUPABASE_DATABASE_URL="postgresql://user:password@host:port/database"'
    );
  }
  const pool = new Pool({
    connectionString: databaseUrl,
    application_name: applicationName,
  });
  const db = drizzle(pool);
  return { db, pool };
}
