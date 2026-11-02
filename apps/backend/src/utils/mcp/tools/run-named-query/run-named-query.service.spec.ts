import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AnalyticsDatabaseService } from '@tet/backend/utils/database/analytics-database.service';
import { success } from '@tet/backend/utils/result.type';
import { RunNamedQueryService } from './run-named-query.service';

const user = { id: 'user-1' } as AuthenticatedUser;

function buildService() {
  const analytics = {
    query: vi.fn(async () =>
      success({
        columns: ['collectivites_actives', 'utilisateurs_actifs'],
        rows: [{ collectivites_actives: 42, utilisateurs_actifs: 77 }],
        truncated: false,
        totalRowCount: 1,
      })
    ),
  } as unknown as AnalyticsDatabaseService;
  const permissions = {
    isAllowed: vi.fn(async () => success(undefined)),
  } as unknown as PermissionService;
  return {
    service: new RunNamedQueryService(analytics, permissions),
    analytics,
  };
}

describe('RunNamedQueryService', () => {
  test("lie les paramètres dans l'ordre déclaré et renvoie la requête exécutée", async () => {
    const { service, analytics } = buildService();

    const result = await service.run(
      { name: 'collectivites_actives_periode', params: { jours: '90' } },
      { user }
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        name: 'collectivites_actives_periode',
        params: { jours: 90 },
        rows: [{ collectivites_actives: 42, utilisateurs_actifs: 77 }],
        rowCount: 1,
      },
    });
    expect(analytics.query).toHaveBeenCalledWith(
      expect.objectContaining({ values: [90], maxRows: 1 })
    );
  });

  test('refuse un paramètre hors bornes', async () => {
    const { service, analytics } = buildService();

    const result = await service.run(
      { name: 'collectivites_actives_periode', params: { jours: 2 } },
      { user }
    );

    expect(result).toMatchObject({ success: false, error: 'INVALID_PARAMS' });
    expect(analytics.query).not.toHaveBeenCalled();
  });

  test('refuse une requête inconnue', async () => {
    const { service } = buildService();

    const result = await service.run({ name: 'inconnue' }, { user });

    expect(result).toMatchObject({ success: false, error: 'NOT_FOUND' });
  });

  test('liste les requêtes avec leurs paramètres', () => {
    const { service } = buildService();

    const { queries } = service.list();

    expect(queries.map((query) => query.name)).toContain(
      'plans_actifs_52_semaines'
    );
    expect(
      queries.find((query) => query.name === 'collectivites_actives_periode')
        ?.params
    ).toEqual([{ name: 'jours', description: expect.any(String) }]);
  });
});
