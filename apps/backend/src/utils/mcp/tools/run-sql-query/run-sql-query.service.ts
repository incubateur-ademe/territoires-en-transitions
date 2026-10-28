import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AnalyticsDatabaseService } from '@tet/backend/utils/database/analytics-database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { MCP_PREVIEW_ROWS } from '../../mcp.constants';
import { RunSqlQueryError } from './run-sql-query.errors';
import { RunSqlQueryInput } from './run-sql-query.input';
import { validateSelectSql } from './validate-select-sql.rules';

export const runSqlQueryOutputSchema = z.object({
  columns: z.array(z.string()),
  columnCount: z.number(),
  totalRowCount: z
    .number()
    .nullable()
    .describe('Nombre total de lignes, null si le comptage a échoué'),
  previewRowCount: z.number(),
  previewRows: z.array(z.record(z.string(), z.unknown())),
  truncated: z.boolean(),
  note: z.string(),
});

export type RunSqlQueryOutput = z.infer<typeof runSqlQueryOutputSchema>;

@Injectable()
export class RunSqlQueryService {
  private readonly logger = new Logger(RunSqlQueryService.name);

  constructor(
    private readonly analyticsDatabaseService: AnalyticsDatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async run(
    input: RunSqlQueryInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<RunSqlQueryOutput, RunSqlQueryError>> {
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.read',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED');
    }

    const validated = validateSelectSql(input.sql);
    if (!validated.ok) {
      this.logger.warn(`run_sql_query rejected: ${validated.reason}`);
      return failure('INVALID_SQL', new Error(validated.reason));
    }

    // Journal d'audit : la requête seule, jamais les données renvoyées.
    this.logger.log(
      `run_sql_query: ${validated.sql.replace(/\s+/g, ' ').slice(0, 2000)}`
    );
    const startedAt = Date.now();
    const result = await this.analyticsDatabaseService.query({
      text: validated.sql,
      maxRows: MCP_PREVIEW_ROWS,
    });
    const durationMs = Date.now() - startedAt;

    if (!result.success) {
      this.logger.warn(
        `run_sql_query failed in ${durationMs}ms (${result.error}): ${result.cause?.message}`
      );
      return result;
    }

    const { columns, rows, truncated } = result.data;
    const totalRowCount = truncated
      ? await this.analyticsDatabaseService.countRows({ text: validated.sql })
      : rows.length;
    this.logger.log(
      `run_sql_query ok in ${durationMs}ms: ${rows.length} rows shown, ${totalRowCount} total`
    );

    return success({
      columns,
      columnCount: columns.length,
      totalRowCount,
      previewRowCount: rows.length,
      previewRows: rows,
      truncated,
      note: truncated
        ? `Aperçu limité à ${MCP_PREVIEW_ROWS} lignes sur ${
            totalRowCount ?? 'un nombre inconnu de'
          } : agrège ou filtre davantage plutôt que de lister.`
        : 'Résultat complet.',
    });
  }
}
