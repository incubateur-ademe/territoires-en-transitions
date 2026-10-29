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

const TOTAL_ROW_COUNT_COLUMN = '_total_row_count';

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
  /** Nombre de lignes de la requête complète, avant troncature. */
  totalRowCount: number;
};

/**
 * Connexion à la base analytique (miroir `prod` + statistiques `public`),
 * distincte de la base applicative. Elle n'est ouverte que si
 * `ANALYTICS_DATABASE_URL` est renseignée : sans elle, les requêtes échouent
 * avec `ANALYTICS_DATABASE_NOT_CONFIGURED` et le backend démarre quand même.
 *
 * Lecture seule à trois niveaux : rôle Postgres (la vraie garde, hors
 * dépôt), `default_transaction_read_only` posé comme paramètre de connexion
 * (un refus fait échouer la connexion, pas un simple log), et sous-requête
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
        urlVariable: 'ANALYTICS_DATABASE_URL',
        caVariable: 'ANALYTICS_DATABASE_SSL_ROOT_CERT',
      }),
      application_name: 'Backend MCP analytics',
      options: '-c default_transaction_read_only=on',
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      statement_timeout: ANALYTICS_STATEMENT_TIMEOUT_MS,
      idle_in_transaction_session_timeout: 15000,
    });
    this.pool.on('error', (error) =>
      this.logger.error(`Analytics pool error: ${error.message}`)
    );
    this.logger.log('Initializing analytics database service');
  }

  isConfigured(): boolean {
    return this.pool !== null;
  }

  /**
   * Exécute la requête une seule fois : le total vient d'une fonction de
   * fenêtrage, pas d'un second passage.
   */
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

    const limit = Math.max(1, Math.floor(maxRows)) + 1;
    const wrapped = `SELECT _sub.*, count(*) OVER () AS ${TOTAL_ROW_COUNT_COLUMN} FROM (\n${text}\n) AS _sub LIMIT ${limit}`;

    try {
      const result = await this.pool.query(wrapped, values);
      const totalRowCount = Number(
        result.rows[0]?.[TOTAL_ROW_COUNT_COLUMN] ?? 0
      );
      return success({
        columns: result.fields
          .map((field) => field.name)
          .filter((name) => name !== TOTAL_ROW_COUNT_COLUMN),
        rows: result.rows.slice(0, maxRows).map((row) => {
          const { [TOTAL_ROW_COUNT_COLUMN]: _total, ...rest } = row;
          return rest;
        }),
        truncated: result.rows.length > maxRows,
        totalRowCount,
      });
    } catch (error) {
      return failure(toAnalyticsDatabaseError(error), error as Error);
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
