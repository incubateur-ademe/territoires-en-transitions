import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import ConfigurationService from '../config/configuration.service';
import {
  PgInvalidTransactionState,
  PgOperatorIntervention,
  PgSyntaxErrorOrAccessRuleViolation,
} from '../postgresql-error-codes.enum';
import { failure, Result, success } from '../result.type';
import { AnalyticsDatabaseError } from './analytics-database.errors';
import { buildDatabaseSsl } from './build-database-ssl';

export const ANALYTICS_STATEMENT_TIMEOUT_MS = 10_000;

export type AnalyticsQuery = {
  text: string;
  values?: unknown[];
  /** Lignes conservées ; au-delà, `truncated` vaut true. */
  maxRows: number;
};

export type AnalyticsQueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  truncated: boolean;
};

/**
 * Connexion à la base analytique (miroir `prod` + statistiques `public`),
 * distincte de la base applicative. Elle n'est ouverte que si
 * `ANALYTICS_DATABASE_URL` est renseignée : sans elle, les requêtes échouent
 * avec `ANALYTICS_DATABASE_NOT_CONFIGURED` et le backend démarre quand même.
 *
 * Lecture seule à trois niveaux : rôle Postgres (la vraie garde, hors
 * dépôt), `default_transaction_read_only` posé à la connexion, et sous-requête
 * `LIMIT` qui rend toute seconde instruction syntaxiquement invalide.
 */
@Injectable()
export class AnalyticsDatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(AnalyticsDatabaseService.name);

  private readonly pool: Pool | null;

  constructor(private readonly configService: ConfigurationService) {
    const url = this.configService.get('ANALYTICS_DATABASE_URL');
    if (!url) {
      this.pool = null;
      this.logger.log(
        'Analytics database not configured (ANALYTICS_DATABASE_URL)'
      );
      return;
    }

    this.pool = new Pool({
      connectionString: url,
      ssl: buildDatabaseSsl({
        url,
        ca: this.configService.get('ANALYTICS_DATABASE_SSL_ROOT_CERT'),
      }),
      application_name: `Backend MCP analytics ${process.env.APPLICATION_VERSION}`,
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      statement_timeout: ANALYTICS_STATEMENT_TIMEOUT_MS,
      idle_in_transaction_session_timeout: 15000,
    });
    this.pool.on('connect', (client) => {
      client
        .query('SET default_transaction_read_only = on')
        .catch((error: Error) =>
          this.logger.error(
            `Cannot set analytics connection read only: ${error.message}`
          )
        );
    });
    this.pool.on('error', (error) =>
      this.logger.error(`Analytics pool error: ${error.message}`)
    );
    this.logger.log('Initializing analytics database service');
  }

  isConfigured(): boolean {
    return this.pool !== null;
  }

  async query({
    text,
    values = [],
    maxRows,
  }: AnalyticsQuery): Promise<
    Result<AnalyticsQueryResult, AnalyticsDatabaseError>
  > {
    if (!this.pool) {
      return failure('ANALYTICS_DATABASE_NOT_CONFIGURED');
    }

    const wrapped = `SELECT * FROM (\n${text}\n) AS _sub LIMIT ${
      Math.max(1, Math.floor(maxRows)) + 1
    }`;

    try {
      const result = await this.pool.query(wrapped, values);
      return success({
        columns: result.fields.map((field) => field.name),
        rows: result.rows.slice(0, maxRows),
        truncated: result.rows.length > maxRows,
      });
    } catch (error) {
      return failure(toAnalyticsDatabaseError(error), error as Error);
    }
  }

  /** Nombre total de lignes d'une requête, ou null si le comptage échoue. */
  async countRows({
    text,
    values = [],
  }: Omit<AnalyticsQuery, 'maxRows'>): Promise<number | null> {
    if (!this.pool) {
      return null;
    }
    try {
      const result = await this.pool.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM (\n${text}\n) AS _count`,
        values
      );
      return result.rows[0]?.n ?? null;
    } catch (error) {
      this.logger.warn(
        `Analytics row count failed: ${(error as Error).message}`
      );
      return null;
    }
  }

  async onApplicationShutdown(signal: string) {
    if (this.pool && !this.pool.ended) {
      this.logger.log(
        `Closing analytics database service for signal ${signal}`
      );
      await this.pool.end();
    }
  }
}

function toAnalyticsDatabaseError(error: unknown): AnalyticsDatabaseError {
  const code = (error as { code?: string }).code;
  if (code === PgOperatorIntervention.QueryCanceled) {
    return 'ANALYTICS_QUERY_TIMEOUT';
  }
  if (
    code === PgInvalidTransactionState.ReadOnlySqlTransaction ||
    code === PgSyntaxErrorOrAccessRuleViolation.InsufficientPrivilege
  ) {
    return 'ANALYTICS_QUERY_READ_ONLY_VIOLATION';
  }
  return 'ANALYTICS_QUERY_ERROR';
}
