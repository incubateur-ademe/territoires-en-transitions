import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AnalyticsDatabaseError } from '@tet/backend/utils/database/analytics-database.errors';
import { AnalyticsDatabaseService } from '@tet/backend/utils/database/analytics-database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { MCP_MAX_SCHEMA_ROWS } from '../../mcp.constants';

const identifierSchema = z
  .string()
  .regex(/^[a-z_][a-z0-9_]*$/i)
  .max(63);

export const listTablesInputSchema = z.object({
  schema: identifierSchema
    .default('public')
    .describe(
      "Schéma Postgres : 'public' (statistiques) ou 'prod' (miroir applicatif)"
    ),
});
export type ListTablesInput = z.infer<typeof listTablesInputSchema>;

export const listTablesOutputSchema = z.object({
  schema: z.string(),
  tables: z.array(z.object({ name: z.string(), type: z.string() })),
});
export type ListTablesOutput = z.infer<typeof listTablesOutputSchema>;

export const describeTableInputSchema = z.object({
  schema: identifierSchema.default('public').describe('Schéma Postgres'),
  table: identifierSchema.describe('Nom de la table ou de la vue'),
});
export type DescribeTableInput = z.infer<typeof describeTableInputSchema>;

export const describeTableOutputSchema = z.object({
  schema: z.string(),
  table: z.string(),
  columns: z.array(
    z.object({
      name: z.string(),
      dataType: z.string(),
      nullable: z.boolean(),
    })
  ),
});
export type DescribeTableOutput = z.infer<typeof describeTableOutputSchema>;

type DescribeTableError = AnalyticsDatabaseError | 'NOT_FOUND';

/**
 * Le modèle n'a pas accès à `information_schema` par `run_sql_query` : ces
 * deux lectures le remplacent, limitées aux objets que le rôle analytique
 * a le droit de lire (les tables personnelles n'y apparaissent pas).
 */
@Injectable()
export class DescribeTableService {
  constructor(
    private readonly analyticsDatabaseService: AnalyticsDatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listTables(
    input: ListTablesInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<ListTablesOutput, DescribeTableError>> {
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.read',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED');
    }

    const result = await this.analyticsDatabaseService.query({
      text: `SELECT table_name AS name, table_type AS type
        FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name`,
      values: [input.schema],
      maxRows: MCP_MAX_SCHEMA_ROWS,
    });
    if (!result.success) {
      return result;
    }
    return success({
      schema: input.schema,
      tables: result.data.rows.map((row) => ({
        name: String(row.name),
        type: String(row.type),
      })),
    });
  }

  async describeTable(
    input: DescribeTableInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<DescribeTableOutput, DescribeTableError>> {
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.read',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED');
    }

    const result = await this.analyticsDatabaseService.query({
      text: `SELECT column_name AS name, data_type AS data_type, is_nullable AS is_nullable
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position`,
      values: [input.schema, input.table],
      maxRows: MCP_MAX_SCHEMA_ROWS,
    });
    if (!result.success) {
      return result;
    }
    if (result.data.rows.length === 0) {
      return failure(
        'NOT_FOUND',
        new Error(
          `Table ${input.schema}.${input.table} introuvable ou non accessible`
        )
      );
    }
    return success({
      schema: input.schema,
      table: input.table,
      columns: result.data.rows.map((row) => ({
        name: String(row.name),
        dataType: String(row.data_type),
        nullable: row.is_nullable === 'YES',
      })),
    });
  }
}
