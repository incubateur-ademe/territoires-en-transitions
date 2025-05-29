import { AuthenticatedUser } from '@/backend/auth/index-domain';
import { DatabaseService } from '@/backend/utils';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from 'backend/test/app-utils';
import { getAuthUser } from 'backend/test/auth-utils';

const COLLECTIVITE_ID = 1;

/*
async function  insertTestData(db: DatabaseService["db"]) {
  const indicateurId = await db.select().from(indicateurDefinitionTable).where(eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_'))
}*/

describe('ScoreIndicatifRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    yoloDodoUser = await getAuthUser();

    // TODO: reset/insert test data
    /**
     *     await databaseService.db
      .delete(actionScoreIndicateurValeurTable)
      .where(
        eq(actionScoreIndicateurValeurTable.collectiviteId, COLLECTIVITE_ID)
      );

    */
  });

  test('Demander le score', async () => {
    /* await databaseService.db
      .insert(actionScoreIndicateurValeurTable)
      .values([{
        collectiviteId: COLLECTIVITE_ID,
        indicateurId
      }])*/

    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: 1,
      actionId: 'cae_1.2.3.3.4',
    });

    expect(result).toMatchObject({
      fait: {
        score: 1,
        sourceLibelle: 'CITEPA',
        sourceMetadonnee: {
          id: 1,
          limites: '',
          diffuseur: 'Citepa',
          sourceId: 'citepa',
          producteur: 'Citepa - Territoires en Transitions',
          nomDonnees: '',
          dateVersion: '2023-01-01T00:00:00',
          methodologie:
            'Inventaire GES spatialisé (CITEPA 2023 - année 2021 et CITEPA 2021 - années 2016 et 2018) et périmètre (Banatic 2023)',
        },
      },
      programme: null,
    });
  });
});
