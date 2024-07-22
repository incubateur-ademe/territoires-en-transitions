import { Injectable } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';

@Injectable()
export default class DatabaseService {
  public readonly db: PostgresJsDatabase;

  constructor() {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        'postgresql://postgres:postgres@localhost:54322/postgres';
    }
    console.log(`Initializing database service`);
    const client = postgres(process.env.DATABASE_URL!);
    this.db = drizzle(client);
  }
}
