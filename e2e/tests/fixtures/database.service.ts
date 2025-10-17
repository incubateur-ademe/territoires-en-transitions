import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

class DatabaseService {
  private readonly pool = new Pool({
    connectionString: process.env.SUPABASE_DATABASE_URL,
    application_name: `Test`,
  });

  public readonly db = drizzle({
    client: this.pool,
    schema: {},
  });
}

export const databaseService = new DatabaseService();
