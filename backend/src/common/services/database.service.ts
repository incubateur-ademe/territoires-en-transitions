import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';

@Injectable()
export default class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  public readonly db: PostgresJsDatabase;
  private readonly client: postgres.Sql;

  constructor() {
    if (!process.env.DATABASE_URL) {
      // TODO: Use env var & throw exception if not set
      process.env.DATABASE_URL =
        'postgresql://postgres:postgres@localhost:54322/postgres';
    }
    this.logger.log(`Initializing database service`);
    this.client = postgres(process.env.DATABASE_URL!, {
      prepare: false,
    });

    this.db = drizzle(this.client);
  }

  async onApplicationShutdown(signal: string) {
    this.logger.log(`Closing database service for signal ${signal}`);
    await this.client.end();
  }
}
