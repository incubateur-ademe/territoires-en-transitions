import { AnalyticsDatabaseService } from '@tet/backend/utils/database/analytics-database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { GetSiteStatsHeroSectionService } from './get-site-stats-hero-section.service';

function buildService(analytics: Partial<AnalyticsDatabaseService>) {
  return new GetSiteStatsHeroSectionService({
    isConfigured: () => true,
    ...analytics,
  } as AnalyticsDatabaseService);
}

const queryResult = (rows: Record<string, unknown>[]) =>
  success({ columns: [], rows, truncated: false, totalRowCount: rows.length });

describe('GetSiteStatsHeroSectionService', () => {
  test('convertit les bigint rendus en chaînes et garde les null', async () => {
    const service = buildService({
      query: async () =>
        queryResult([
          {
            nb_ct_actif_12_mois: '1234',
            nb_user_actif_12_mois: 5678,
            nb_pap_actif_12_mois: null,
            nb_action_pilotable_active_12_mois: '0',
          },
        ]),
    });

    expect(await service.get()).toEqual(
      success({
        nbCollectivitesActives12Mois: 1234,
        nbUtilisateursActifs12Mois: 5678,
        nbPlansActifs12Mois: null,
        nbActionsPilotablesActives12Mois: 0,
      })
    );
  });

  test('renvoie null sans base analytique ou sans ligne', async () => {
    expect(await buildService({ isConfigured: () => false }).get()).toEqual(
      success(null)
    );
    expect(
      await buildService({ query: async () => queryResult([]) }).get()
    ).toEqual(success(null));
  });

  test("propage l'échec de la requête, que le site ne met pas en cache", async () => {
    const service = buildService({
      query: async () => failure('ANALYTICS_QUERY_ERROR'),
    });

    expect(await service.get()).toMatchObject({
      success: false,
      error: 'DATABASE_ERROR',
    });
  });
});
