import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import BackendConfigurationService from './backend-configuration.service';
@Injectable()
export default class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);

  private pool!: Pool;
  public db!: NodePgDatabase; // todo

  constructor(
    private readonly backendConfigurationService: BackendConfigurationService
  ) {}

  async initializeDatabase(): Promise<void> {
    this.logger.log(`Initializing database service`);
    this.pool = new Pool({
      connectionString:
        this.backendConfigurationService.getBackendConfiguration()
          .SUPABASE_DATABASE_URL,
    });
    this.db = await drizzle(this.pool);
  }

  async onApplicationShutdown(signal: string) {
    this.logger.log(`Closing database service for signal ${signal}`);
    await this.pool.end();
  }
}
