import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import ConfigurationService from '../config/configuration.service';
import { DatabaseServiceInterface } from './database-service.interface';

const dbSchema = {};

@Injectable()
export class DatabaseService
  implements OnApplicationShutdown, DatabaseServiceInterface
{
  private readonly logger = new Logger(DatabaseService.name);

  private readonly pool = new Pool({
    connectionString: this.configService.get('SUPABASE_DATABASE_URL'),
    application_name: `Backend ${process.env.APPLICATION_VERSION}`,
    // Under vitest, each worker holds one shared-app Pool (plus a transient
    // one for option-built apps). With maxWorkers=4 that peaks at ~64
    // connections against a shared CI Postgres, far below max_connections,
    // while max=20 per app would risk saturating it. The higher connect
    // timeout absorbs transient pool saturation under CI load.
    max: process.env.VITEST ? 8 : 20,
    connectionTimeoutMillis: process.env.VITEST ? 10000 : 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 60000,
  });

  public readonly db = drizzle({
    client: this.pool,
    schema: dbSchema,
  });

  constructor(private readonly configService: ConfigurationService) {
    if (process.env.NODE_ENV === 'production') {
      this.logger.log(`Initializing database service`);
    } else {
      this.logger.log(
        `Initializing database service with url: ${this.configService.get(
          'SUPABASE_DATABASE_URL'
        )}`
      );
    }
  }

  async onApplicationShutdown(signal: string) {
    if (!this.pool.ended) {
      this.logger.log(`Closing database service for signal ${signal}`);
      await this.pool.end();
    }
  }
}
