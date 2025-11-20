import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm/sql';
import { Pool } from 'pg';
import ConfigurationService from '../../config/configuration.service';

const dbSchema = {};

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);

  private readonly pool = new Pool({
    connectionString: this.configService.get('SUPABASE_DATABASE_URL'),
    application_name: `Tools Automation Api ${process.env.APPLICATION_VERSION}`,
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
            JSON.stringify(user.jwtPayload)
          )}', TRUE);
          -- auth.uid()
          select set_config('request.jwt.claim.sub', '${sql.raw(
            user.jwtPayload.sub ?? ''
          )}', TRUE);
          -- set local role
          set local role ${sql.raw(user.jwtPayload.role ?? 'anon')};
          `);
          return await transaction(tx);
        } catch (e) {
          this.logger.error(e);
          throw e;
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
    await this.pool.end();
  }
}
