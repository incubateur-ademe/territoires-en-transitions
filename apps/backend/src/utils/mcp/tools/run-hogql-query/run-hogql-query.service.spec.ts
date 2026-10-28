import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AnalyticsDatabaseService } from '@tet/backend/utils/database/analytics-database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { PosthogQueryClient } from './posthog-query.client';
import { RunHogqlQueryService } from './run-hogql-query.service';

const user = { id: 'user-1' } as AuthenticatedUser;

function buildService({
  results,
  internalEmails,
}: {
  results: unknown[][];
  internalEmails: string[] | 'unavailable';
}) {
  const posthog = {
    isConfigured: () => true,
    run: vi.fn(async () =>
      success({
        columns: ['collectivite_id', 'Email', 'n'],
        results,
        hasMore: false,
      })
    ),
  } as unknown as PosthogQueryClient;

  const analytics = {
    query: vi.fn(async () =>
      internalEmails === 'unavailable'
        ? failure('ANALYTICS_DATABASE_NOT_CONFIGURED')
        : success({
            columns: ['email'],
            rows: internalEmails.map((email) => ({ email })),
            truncated: false,
          })
    ),
  } as unknown as AnalyticsDatabaseService;

  const permissions = {
    isAllowed: vi.fn(async () => success(undefined)),
  } as unknown as PermissionService;

  return {
    service: new RunHogqlQueryService(posthog, analytics, permissions),
    analytics,
  };
}

describe('RunHogqlQueryService', () => {
  test('retire les lignes des utilisateurs internes puis la colonne e-mail', async () => {
    const { service, analytics } = buildService({
      results: [
        ['1', 'Agent@Ville.fr', 3],
        ['1', 'interne@beta.gouv.fr', 5],
        ['2', null, 1],
      ],
      internalEmails: ['interne@beta.gouv.fr'],
    });

    const result = await service.run({ hogql: 'select 1 limit 10' }, { user });

    expect(result).toMatchObject({
      success: true,
      data: {
        columns: ['collectivite_id', 'n'],
        totalRowCount: 2,
        previewRows: [
          { collectivite_id: '1', n: 3 },
          { collectivite_id: '2', n: 1 },
        ],
        meta: { internalRowsRemoved: 1, emailColumnsRemoved: ['Email'] },
      },
    });

    // La liste des internes est mise en cache entre deux appels.
    await service.run({ hogql: 'select 1 limit 10' }, { user });
    expect(analytics.query).toHaveBeenCalledTimes(1);
  });

  test('sans liste des internes, la colonne e-mail est quand même retirée', async () => {
    const { service } = buildService({
      results: [['1', 'interne@beta.gouv.fr', 5]],
      internalEmails: 'unavailable',
    });

    const result = await service.run({ hogql: 'select 1 limit 10' }, { user });

    expect(result).toMatchObject({
      success: true,
      data: {
        columns: ['collectivite_id', 'n'],
        totalRowCount: 1,
        meta: { internalRowsRemoved: 0, emailColumnsRemoved: ['Email'] },
      },
    });
  });

  test('signale les dates ignorées sans marqueurs', async () => {
    const { service } = buildService({ results: [], internalEmails: [] });

    const result = await service.run(
      { hogql: 'select 1 limit 10', dateFrom: '2025-01-01' },
      { user }
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        meta: { windows: 1, noteDates: expect.stringContaining('ignorés') },
      },
    });
  });
});
