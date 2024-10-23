import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as postgres } from 'postgres';
import ConfigurationService from '../../config/configuration.service';

@Injectable()
export default class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  public readonly db: PostgresJsDatabase;
  private readonly client: postgres.Sql;

  constructor(private readonly configService: ConfigurationService) {
    this.logger.log(`Initializing database service`);
    this.client = postgres(this.configService.get('SUPABASE_DATABASE_URL'), {
      prepare: false,
      connection: {
        application_name: `Backend ${process.env.APPLICATION_VERSION}`,
      },
    });

    this.db = drizzle(this.client);
  }

  async onApplicationShutdown(signal: string) {
    this.logger.log(`Closing database service for signal ${signal}`);
    await this.client.end();
  }
}
