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
    windows: z.number().describe('Nombre de fenêtres mensuelles prévues'),
    windowsExecuted: z.number(),
    truncatedWindows: z
      .array(z.string())
      .describe(
        'Fenêtres qui ont atteint la limite de lignes : résultat incomplet'
      ),
    rowCapReached: z.boolean(),
    timeBudgetReached: z.boolean(),
    internalRowsRemoved: z.number(),
    internalFilterInQuery: z
      .boolean()
      .describe('Le marqueur {internal_emails} a été remplacé dans la requête'),
    emailColumnsRemoved: z.array(z.string()),
    noteDates: z.string().optional(),
  }),
});

export type RunHogqlQueryOutput = z.infer<typeof runHogqlQueryOutputSchema>;

const INTERNAL_EMAILS_MARKER = '{internal_emails}';
const INTERNAL_EMAILS_CACHE_MS = 60 * 60 * 1000;
const MAX_INTERNAL_EMAILS = 10_000;
/** Au-delà, les fenêtres restantes ne sont pas lancées : une requête HTTP ne
 * peut pas durer des dizaines de minutes derrière le répartiteur de charge. */
const TIME_BUDGET_MS = 60_000;
const EMAIL_COLUMN_PATTERN = /mail|courriel/i;

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

    let hogql = input.hogql.trim();
    const internalFilterInQuery = hogql.includes(INTERNAL_EMAILS_MARKER);
    if (internalFilterInQuery) {
      const internalEmails = await this.getInternalEmails();
      if (internalEmails === null) {
        return failure(
          'INTERNAL_USERS_UNAVAILABLE',
          new Error(
            'La liste des utilisateurs internes est indisponible : {internal_emails} ne peut pas être remplacé.'
          )
        );
      }
      hogql = hogql.replaceAll(
        INTERNAL_EMAILS_MARKER,
        toHogqlStringList(internalEmails)
      );
    }

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

    // Journal d'audit : la requête du modèle, jamais les données renvoyées
    // (ni la liste des internes substituée).
    this.logger.log(
      `run_hogql_query (${windows.length || 1} fenêtre(s)): ${input.hogql
        .replace(/\s+/g, ' ')
        .slice(0, 2000)}`
    );
    const startedAt = Date.now();

    let columns: string[] = [];
    let rows: unknown[][] = [];
    const truncatedWindows: string[] = [];
    let rowCapReached = false;
    let timeBudgetReached = false;
    let windowsExecuted = 0;

    const queries = windowed
      ? windows.map((window) => ({ window, hogql: applyWindow(hogql, window) }))
      : [{ window: null, hogql }];

    for (const { window, hogql: query } of queries) {
      if (windowsExecuted > 0 && Date.now() - startedAt > TIME_BUDGET_MS) {
        timeBudgetReached = true;
        break;
      }
      const result = await this.posthogQueryClient.run(query);
      windowsExecuted += 1;
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

    const filtered = await this.removeInternalUsers(columns, rows);
    if (filtered === null) {
      return failure(
        'INTERNAL_USERS_UNAVAILABLE',
        new Error(
          'La liste des utilisateurs internes est indisponible : leurs lignes ne peuvent pas être retirées.'
        )
      );
    }
    const { kept, removed, emailColumnIndexes } = filtered;
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
    const partial = rowCapReached || timeBudgetReached;

    this.logger.log(
      `run_hogql_query ok in ${Date.now() - startedAt}ms: ${
        keptRows.length
      } rows, ${removed} internal removed, ${
        truncatedWindows.length
      } truncated windows, ${windowsExecuted}/${queries.length} windows`
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
          ? `Aperçu limité à ${MCP_PREVIEW_ROWS} lignes sur ${keptRows.length}${
              partial ? ' (total partiel)' : ''
            } : agrège davantage côté PostHog.`
          : 'Résultat complet.',
        truncatedWindows.length > 0
          ? 'Certaines fenêtres ont atteint la limite de lignes : résultats incomplets, ajoute des filtres ou agrège davantage.'
          : null,
        rowCapReached
          ? `Plafond de ${HOGQL_MAX_TOTAL_ROWS} lignes atteint : les fenêtres suivantes n'ont pas été exécutées et le total est partiel.`
          : null,
        timeBudgetReached
          ? `Budget de temps épuisé après ${windowsExecuted} fenêtre(s) sur ${queries.length} : réduis la période ou agrège davantage.`
          : null,
        emailColumnsRemoved.length > 0
          ? 'Les colonnes e-mail ont été retirées du résultat : compte les personnes, ne les liste pas.'
          : null,
      ]
        .filter(Boolean)
        .join(' '),
      meta: {
        windows: queries.length,
        windowsExecuted,
        truncatedWindows,
        rowCapReached,
        timeBudgetReached,
        internalRowsRemoved: removed,
        internalFilterInQuery,
        emailColumnsRemoved,
        noteDates,
      },
    });
  }

  /**
   * Retire les lignes des utilisateurs internes (table `public.internal_users`
   * de la base analytique) sur toute colonne qui ressemble à une adresse
   * e-mail, puis signale ces colonnes pour qu'elles soient supprimées du
   * résultat. Null si la liste des internes est indisponible alors qu'il
   * faut filtrer.
   */
  private async removeInternalUsers(
    columns: string[],
    rows: unknown[][]
  ): Promise<{
    kept: unknown[][];
    removed: number;
    emailColumnIndexes: number[];
  } | null> {
    const emailColumnIndexes = columns
      .map((column, index) =>
        EMAIL_COLUMN_PATTERN.test(column) && !isMeasureColumn(rows, index)
          ? index
          : -1
      )
      .filter((index) => index >= 0);
    if (emailColumnIndexes.length === 0) {
      return { kept: rows, removed: 0, emailColumnIndexes };
    }

    const internalEmails = await this.getInternalEmails();
    if (internalEmails === null) {
      return null;
    }
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

  /** Adresses internes en minuscules, ou null si la base analytique ne répond pas. */
  private async getInternalEmails(): Promise<Set<string> | null> {
    const cache = this.internalEmailsCache;
    if (cache && Date.now() - cache.loadedAt < INTERNAL_EMAILS_CACHE_MS) {
      return cache.emails;
    }
    const result = await this.analyticsDatabaseService.query({
      text: 'SELECT DISTINCT lower(trim(email)) AS email FROM public.internal_users WHERE email IS NOT NULL',
      maxRows: MAX_INTERNAL_EMAILS,
    });
    if (!result.success) {
      this.logger.warn(`Internal users unavailable (${result.error})`);
      return null;
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

/** Liste HogQL de chaînes entre apostrophes, apostrophes internes doublées. */
function toHogqlStringList(values: Set<string>): string {
  if (values.size === 0) {
    // Pas `''` : `coalesce(email, '') NOT IN ('')` exclurait les anonymes.
    // Une adresse ne contient pas d'espace, cette valeur n'en retire aucune.
    return "'aucun utilisateur interne'";
  }
  return [...values]
    .map((value) => `'${value.replaceAll("'", "''")}'`)
    .join(', ');
}

/** Mesure agrégée (`email_count`) : nombres ou booléens seulement, jamais
 * d'adresse à filtrer ni à masquer. */
function isMeasureColumn(rows: unknown[][], index: number): boolean {
  return rows.every((row) => {
    const value = row[index];
    return (
      value === null ||
      value === undefined ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  });
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
