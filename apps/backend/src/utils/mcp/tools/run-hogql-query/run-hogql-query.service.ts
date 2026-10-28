import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AnalyticsDatabaseService } from '@tet/backend/utils/database/analytics-database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { MCP_PREVIEW_ROWS } from '../../mcp.constants';
import { PosthogQueryClient } from './posthog-query.client';
import { RunHogqlQueryError } from './run-hogql-query.errors';
import { RunHogqlQueryInput } from './run-hogql-query.input';
import {
  applyWindow,
  buildMonthlyWindows,
  hasWindowMarkers,
  HOGQL_MAX_TOTAL_ROWS,
  HOGQL_WINDOW_ROW_LIMIT,
  HogqlWindow,
} from './window-hogql.rules';

export const runHogqlQueryOutputSchema = z.object({
  columns: z.array(z.string()),
  columnCount: z.number(),
  totalRowCount: z.number(),
  previewRowCount: z.number(),
  previewRows: z.array(z.record(z.string(), z.unknown())),
  truncated: z.boolean(),
  note: z.string(),
  meta: z.object({
    windows: z.number().describe('Nombre de fenêtres mensuelles exécutées'),
    truncatedWindows: z
      .array(z.string())
      .describe(
        'Fenêtres qui ont atteint la limite de lignes : résultat incomplet'
      ),
    rowCapReached: z.boolean(),
    internalRowsRemoved: z.number(),
    emailColumnsRemoved: z.array(z.string()),
    noteDates: z.string().optional(),
  }),
});

export type RunHogqlQueryOutput = z.infer<typeof runHogqlQueryOutputSchema>;

const INTERNAL_EMAILS_CACHE_MS = 60 * 60 * 1000;
const MAX_INTERNAL_EMAILS = 10_000;

@Injectable()
export class RunHogqlQueryService {
  private readonly logger = new Logger(RunHogqlQueryService.name);

  private internalEmailsCache: {
    emails: Set<string>;
    loadedAt: number;
  } | null = null;

  constructor(
    private readonly posthogQueryClient: PosthogQueryClient,
    private readonly analyticsDatabaseService: AnalyticsDatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async run(
    input: RunHogqlQueryInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<RunHogqlQueryOutput, RunHogqlQueryError>> {
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.read',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED');
    }
    if (!this.posthogQueryClient.isConfigured()) {
      return failure('POSTHOG_NOT_CONFIGURED');
    }

    const hogql = input.hogql.trim();
    const windowed = hasWindowMarkers(hogql);
    let windows: HogqlWindow[] = [];
    let noteDates: string | undefined;
    if (windowed) {
      if (!input.dateFrom) {
        return failure(
          'INVALID_DATE_RANGE',
          new Error(
            'La requête contient {start}/{end} : dateFrom est obligatoire.'
          )
        );
      }
      const built = buildMonthlyWindows({
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });
      if (!built.ok) {
        return failure('INVALID_DATE_RANGE', new Error(built.reason));
      }
      windows = built.windows;
    } else if (input.dateFrom || input.dateTo) {
      noteDates =
        'dateFrom/dateTo ignorés : la requête ne contient pas les marqueurs {start}/{end}.';
    }

    // Journal d'audit : la requête seule, jamais les données renvoyées.
    this.logger.log(
      `run_hogql_query (${windows.length || 1} fenêtre(s)): ${hogql
        .replace(/\s+/g, ' ')
        .slice(0, 2000)}`
    );
    const startedAt = Date.now();

    let columns: string[] = [];
    let rows: unknown[][] = [];
    const truncatedWindows: string[] = [];
    let rowCapReached = false;

    const queries = windowed
      ? windows.map((window) => ({ window, hogql: applyWindow(hogql, window) }))
      : [{ window: null, hogql }];

    for (const { window, hogql: query } of queries) {
      const result = await this.posthogQueryClient.run(query);
      if (!result.success) {
        const prefix = window
          ? `[fenêtre ${window.start} → ${window.end}] `
          : '';
        this.logger.warn(
          `run_hogql_query failed: ${prefix}${result.cause?.message}`
        );
        return failure(
          result.error,
          new Error(`${prefix}${result.cause?.message ?? result.error}`)
        );
      }
      columns = result.data.columns;
      if (
        result.data.hasMore ||
        result.data.results.length >= HOGQL_WINDOW_ROW_LIMIT
      ) {
        truncatedWindows.push(
          window ? `${window.start} → ${window.end}` : 'requête entière'
        );
      }
      rows.push(...result.data.results);
      if (rows.length >= HOGQL_MAX_TOTAL_ROWS) {
        rowCapReached = true;
        break;
      }
    }

    if (queries.length > 1) {
      rows = dedupeRows(rows);
    }
    rows = rows.slice(0, HOGQL_MAX_TOTAL_ROWS);

    const { kept, removed, emailColumnIndexes } =
      await this.removeInternalUsers(columns, rows);
    const emailColumnsRemoved = emailColumnIndexes.map(
      (index) => columns[index]
    );
    const keptColumns = columns.filter(
      (_, index) => !emailColumnIndexes.includes(index)
    );
    const keptRows = kept.map((row) =>
      row.filter((_, index) => !emailColumnIndexes.includes(index))
    );

    const previewRows = keptRows
      .slice(0, MCP_PREVIEW_ROWS)
      .map((row) => Object.fromEntries(keptColumns.map((c, i) => [c, row[i]])));
    const truncated = keptRows.length > MCP_PREVIEW_ROWS;

    this.logger.log(
      `run_hogql_query ok in ${Date.now() - startedAt}ms: ${
        keptRows.length
      } rows, ${removed} internal removed, ${
        truncatedWindows.length
      } truncated windows`
    );

    return success({
      columns: keptColumns,
      columnCount: keptColumns.length,
      totalRowCount: keptRows.length,
      previewRowCount: previewRows.length,
      previewRows,
      truncated,
      note: [
        truncated
          ? `Aperçu limité à ${MCP_PREVIEW_ROWS} lignes sur ${keptRows.length} : agrège davantage côté PostHog.`
          : 'Résultat complet.',
        truncatedWindows.length > 0
          ? 'Certaines fenêtres ont atteint la limite de lignes : résultats incomplets, ajoute des filtres ou agrège davantage.'
          : null,
        emailColumnsRemoved.length > 0
          ? 'Les colonnes e-mail ont été retirées du résultat : compte les personnes, ne les liste pas.'
          : null,
      ]
        .filter(Boolean)
        .join(' '),
      meta: {
        windows: queries.length,
        truncatedWindows,
        rowCapReached,
        internalRowsRemoved: removed,
        emailColumnsRemoved,
        noteDates,
      },
    });
  }

  /**
   * Retire les lignes des utilisateurs internes (table `public.internal_users`
   * de la base analytique) sur toute colonne nommée `email`, puis signale ces
   * colonnes pour qu'elles soient supprimées du résultat.
   */
  private async removeInternalUsers(
    columns: string[],
    rows: unknown[][]
  ): Promise<{
    kept: unknown[][];
    removed: number;
    emailColumnIndexes: number[];
  }> {
    const emailColumnIndexes = columns
      .map((column, index) => (column.toLowerCase() === 'email' ? index : -1))
      .filter((index) => index >= 0);
    if (emailColumnIndexes.length === 0) {
      return { kept: rows, removed: 0, emailColumnIndexes };
    }

    const internalEmails = await this.getInternalEmails();
    if (internalEmails.size === 0) {
      return { kept: rows, removed: 0, emailColumnIndexes };
    }

    const kept = rows.filter(
      (row) =>
        !emailColumnIndexes.some((index) => {
          const value = row[index];
          return (
            typeof value === 'string' &&
            internalEmails.has(value.trim().toLowerCase())
          );
        })
    );
    return { kept, removed: rows.length - kept.length, emailColumnIndexes };
  }

  private async getInternalEmails(): Promise<Set<string>> {
    const cache = this.internalEmailsCache;
    if (cache && Date.now() - cache.loadedAt < INTERNAL_EMAILS_CACHE_MS) {
      return cache.emails;
    }
    const result = await this.analyticsDatabaseService.query({
      text: 'SELECT DISTINCT lower(trim(email)) AS email FROM public.internal_users WHERE email IS NOT NULL',
      maxRows: MAX_INTERNAL_EMAILS,
    });
    if (!result.success) {
      this.logger.warn(
        `Internal users unavailable (${result.error}): PostHog rows are not filtered`
      );
      return new Set();
    }
    const emails = new Set(
      result.data.rows
        .map((row) => row.email)
        .filter((email): email is string => typeof email === 'string')
    );
    this.internalEmailsCache = { emails, loadedAt: Date.now() };
    return emails;
  }
}

function dedupeRows(rows: unknown[][]): unknown[][] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
