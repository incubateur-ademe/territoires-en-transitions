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
    return this.withLocalRole({
      role: user.jwtPayload.role ?? 'anon',
      jwtClaims: user.jwtPayload,
    });
  }

  // À utiliser depuis les workers (cron, consumers) qui n'ont pas d'utilisateur
  // authentifié mais ont besoin de lire des vues filtrées par `is_service_role()`.
  //
  // Deux niveaux à configurer en parallèle :
  // 1. `set local role service_role` : Supabase configure le rôle service_role
  //    avec l'attribut BYPASSRLS, donc une fois la session basculée, les
  //    policies RLS des tables sous-jacentes ne s'appliquent plus. Sans ce
  //    SET, on reste sur le rôle de la connexion (par ex. `postgres` qui
  //    selon l'environnement Supabase n'a pas forcément BYPASSRLS) et les
  //    RLS bloquent les jointures internes — par ex. `labellisation` exige
  //    `auth.role() = 'authenticated'`, ce qui exclurait service_role et
  //    ferait retourner 0 ligne à `crm_labellisations`.
  // 2. Le claim JWT `role: service_role` : nécessaire car les prédicats des
  //    vues type `where is_service_role()` lisent `auth.role()`, qui vient
  //    des JWT claims, pas du rôle Postgres courant.
  withServiceRole() {
    return this.withLocalRole({
      role: 'service_role',
      jwtClaims: { role: 'service_role' },
    });
  }

  private withLocalRole({
    role,
    jwtClaims,
  }: {
    role?: string;
    jwtClaims?: Record<string, unknown>;
  }) {
    return (async (transaction, ...rest) => {
      return await this.db.transaction(async (tx) => {
        // Supabase exposes auth.uid() and auth.jwt()
        // https://supabase.com/docs/guides/database/postgres/row-level-security#helper-functions
        try {
          if (jwtClaims) {
            await tx.execute(sql`
              -- auth.jwt()
              select set_config('request.jwt.claims', '${sql.raw(
                JSON.stringify(jwtClaims)
              )}', TRUE);
              -- auth.uid()
              select set_config('request.jwt.claim.sub', '${sql.raw(
                (jwtClaims['sub'] as string) ?? ''
              )}', TRUE);
            `);
          }
          if (role) {
            await tx.execute(sql`set local role ${sql.raw(role)};`);
          }
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
