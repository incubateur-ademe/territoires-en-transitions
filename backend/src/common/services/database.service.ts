import { Injectable, Logger } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createClient } from '@supabase/supabase-js';
import * as postgres from 'postgres';

@Injectable()
export default class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  public readonly db: PostgresJsDatabase;

  // TODO: Type it
  public readonly supabaseDb = createClient(
    process.env.SUPABASE_URL! || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY! || 'pwd', // TODO: Use env var
    {
      db: {
        schema: 'public',
      },
    },
  );

  constructor() {
    if (!process.env.DATABASE_URL) {
      // TODO: Use env var & throw exception if not set
      process.env.DATABASE_URL =
        'postgresql://postgres:postgres@localhost:54322/postgres';
    }
    this.logger.log(`Initializing database service`);
    const client = postgres(process.env.DATABASE_URL!);
    this.db = drizzle(client);
  }
}
