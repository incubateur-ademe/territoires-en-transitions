import { AuthUser } from '@/backend/auth/models/auth.models';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { default as postgres } from 'postgres';
import ConfigurationService from '../config/configuration.service';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);

  private readonly client = postgres(
    this.configService.get('SUPABASE_DATABASE_URL'),
    {
      prepare: false,
      connection: {
        application_name: `Backend ${process.env.APPLICATION_VERSION}`,
      },
    }
  );

  public readonly db = drizzle(this.client);

  constructor(private readonly configService: ConfigurationService) {
    this.logger.log(`Initializing database service`);
  }

  // Taken from https://orm.drizzle.team/docs/rls
  rls(user: AuthUser) {
    return (async (transaction, ...rest) => {
      return await this.db.transaction(async (tx) => {
        // Supabase exposes auth.uid() and auth.jwt()
        // https://supabase.com/docs/guides/database/postgres/row-level-security#helper-functions
        try {
          await tx.execute(sql`
          -- auth.jwt()
          select set_config('request.jwt.claims', '${sql.raw(
            JSON.stringify(user.jwtToken)
          )}', TRUE);
          -- auth.uid()
          select set_config('request.jwt.claim.sub', '${sql.raw(
            user.jwtToken.sub ?? ''
          )}', TRUE);
          -- set local role
          set local role ${sql.raw(user.jwtToken.role ?? 'anon')};
          `);
          return await transaction(tx);
        } finally {
          await tx.execute(sql`
            -- reset
            select set_config('request.jwt.claims', NULL, TRUE);
            select set_config('request.jwt.claim.sub', NULL, TRUE);
            reset role;
          `);
        }
      }, ...rest);
    }) as typeof this.db.transaction;
  }

  async onApplicationShutdown(signal: string) {
    this.logger.log(`Closing database service for signal ${signal}`);
    await this.client.end();
  }
}
