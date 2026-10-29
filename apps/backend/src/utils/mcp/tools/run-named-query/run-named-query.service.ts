import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AnalyticsDatabaseError } from '@tet/backend/utils/database/analytics-database.errors';
import { AnalyticsDatabaseService } from '@tet/backend/utils/database/analytics-database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { findNamedQuery, NAMED_QUERIES } from './named-queries.catalog';

export const listNamedQueriesOutputSchema = z.object({
  queries: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      description: z.string(),
      params: z.array(z.object({ name: z.string(), description: z.string() })),
    })
  ),
});
export type ListNamedQueriesOutput = z.infer<
  typeof listNamedQueriesOutputSchema
>;

export const runNamedQueryInputSchema = z.object({
  name: z
    .string()
    .describe('Nom de la requête, tel que listé par list_named_queries'),
  params: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .optional()
    .describe('Valeurs des paramètres déclarés par la requête'),
});
export type RunNamedQueryInput = z.infer<typeof runNamedQueryInputSchema>;

export const runNamedQueryOutputSchema = z.object({
  name: z.string(),
  sql: z
    .string()
    .describe('Requête exécutée, à citer dans la section Recherche'),
  params: z.record(z.string(), z.union([z.string(), z.number()])),
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.unknown())),
  rowCount: z.number(),
  truncated: z.boolean(),
});
export type RunNamedQueryOutput = z.infer<typeof runNamedQueryOutputSchema>;

type RunNamedQueryError =
  | AnalyticsDatabaseError
  | 'NOT_FOUND'
  | 'INVALID_PARAMS';

@Injectable()
export class RunNamedQueryService {
  private readonly logger = new Logger(RunNamedQueryService.name);

  constructor(
    private readonly analyticsDatabaseService: AnalyticsDatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  list(): ListNamedQueriesOutput {
    return {
      queries: NAMED_QUERIES.map((query) => ({
        name: query.name,
        title: query.title,
        description: query.description,
        params: query.params.map(({ name, description }) => ({
          name,
          description,
        })),
      })),
    };
  }

  async run(
    input: RunNamedQueryInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<RunNamedQueryOutput, RunNamedQueryError>> {
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.read',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED');
    }

    const query = findNamedQuery(input.name);
    if (!query) {
      return failure(
        'NOT_FOUND',
        new Error(
          `Requête inconnue : ${input.name}. Utilise list_named_queries.`
        )
      );
    }

    const values: (string | number)[] = [];
    const boundParams: Record<string, string | number> = {};
    for (const param of query.params) {
      const parsed = param.schema.safeParse(input.params?.[param.name]);
      if (!parsed.success) {
        return failure(
          'INVALID_PARAMS',
          new Error(
            `Paramètre ${param.name} invalide ou manquant : ${param.description}`
          )
        );
      }
      values.push(parsed.data);
      boundParams[param.name] = parsed.data;
    }

    this.logger.log(
      `run_named_query ${query.name} ${JSON.stringify(boundParams)}`
    );
    const result = await this.analyticsDatabaseService.query({
      text: query.sql,
      values,
      maxRows: query.maxRows,
    });
    if (!result.success) {
      this.logger.warn(
        `run_named_query ${query.name} failed (${result.error}): ${result.cause?.message}`
      );
      return result;
    }

    return success({
      name: query.name,
      sql: query.sql,
      params: boundParams,
      columns: result.data.columns,
      rows: result.data.rows,
      rowCount: result.data.totalRowCount,
      truncated: result.data.truncated,
    });
  }
}
