import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as fs from 'fs';
import { Pool } from 'pg';

function readFileContent(path: string): string {
  return fs.readFileSync(path, 'utf-8');
}

export function getMigrationDb(applicationName: string): {
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

export function getMigrationDbAndCsvPath(
  applicationName: string,
  usage: string
): {
  db: NodePgDatabase;
  pool: Pool;
  fileContent: string;
} {
  const csvPath = process.argv[2];
  if (!csvPath || !fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}\nUsage: ${usage}`);
  }
  const { db, pool } = getMigrationDb(applicationName);
  return { db, pool, fileContent: readFileContent(csvPath) };
}
