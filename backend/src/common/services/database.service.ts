import { Injectable, Logger } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';

@Injectable()
export default class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  public readonly db: PostgresJsDatabase;

  constructor() {
    if (!process.env.DATABASE_URL) {
      // TODO: Use env var & throw exception if not set
      process.env.DATABASE_URL =
        'postgresql://postgres:postgres@localhost:54322/postgres';
    }
    this.logger.log(`Initializing database service`);
    const client = postgres(process.env.DATABASE_URL!, {
      prepare: false,
    });
    this.db = drizzle(client);
  }
}
