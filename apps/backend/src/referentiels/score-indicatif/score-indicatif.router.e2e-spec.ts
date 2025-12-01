import {
  fixturePourScoreIndicatif,
  getAuthUser,
  getIndicateurIdByIdentifiant,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  insertFixturePourScoreIndicatif,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';

describe('ScoreIndicatifRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;
  let indicateurIdCae7: number;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    yoloDodoUser = await getAuthUser();

    // insert test data
    const cleanup = await insertFixturePourScoreIndicatif(
      databaseService,
      fixturePourScoreIndicatif
    );

    indicateurIdCae7 = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_7'
    );

    return async () => {
      await cleanup();
      await app.close();
    };
  });

  test('Lire les valeurs utilisables lève une erreur si on est non authentifié', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.referentiels.actions.getValeursUtilisables({
        collectiviteId: 1,
        actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Lire les valeurs utilisables pour le calcul du score indicatif', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.referentiels.actions.getValeursUtilisables({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
    });

    expect(result).toMatchObject([
      {
        actionId: 'cae_1.2.3.3.4',
        indicateurs: [
          {
            identifiantReferentiel: 'cae_7',
            indicateurId: indicateurIdCae7,
            titre: 'Recyclage des déchets',
            unite: '%',
            selection: {
              fait: {
                id: expect.any(Number),
                annee: 2025,
                source: 'citepa',
                valeur: 63,
              },
              programme: {
                id: expect.any(Number),
                annee: 2025,
                source: 'collectivite',
                valeur: 44,
              },
            },
            sources: [
              {
                source: 'collectivite',
                libelle: null,
                ordreAffichage: 0,
                programme: [
                  {
                    annee: 2025,
                    dateValeur: '2025-05-29',
                    utilisee: true,
                    valeur: 44,
                  },
                ],
                fait: [],
              },
              {
                source: 'citepa',
                libelle: 'CITEPA',
                ordreAffichage: 1000,
                programme: [],
                fait: [
                  {
                    annee: 2025,
                    dateValeur: '2025-05-29',
                    utilisee: true,
                    valeur: 63,
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  test('Lire les valeurs utilisées lève une erreur si on est non authentifié', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.referentiels.actions.getValeursUtilisees({
        collectiviteId: 1,
        actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Lire les valeurs utilisées pour le calcul du score indicatif', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.referentiels.actions.getValeursUtilisees({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
    });

    expect(result).toMatchObject({
      'cae_1.2.3.3.4': [
        {
          actionId: 'cae_1.2.3.3.4',
          dateValeur: '2025-05-29',
          indicateurId: expect.any(Number),
          indicateurValeurId: expect.any(Number),
          sourceLibelle: null,
          sourceMetadonnee: null,
          typeScore: 'programme',
          valeur: 44,
        },
        {
          actionId: 'cae_1.2.3.3.4',
          dateValeur: '2025-05-29',
          indicateurId: expect.any(Number),
          indicateurValeurId: expect.any(Number),
          sourceLibelle: 'CITEPA',
          sourceMetadonnee: {
            dateVersion: expect.any(String),
            diffuseur: expect.any(String),
            id: expect.any(Number),
            limites: '',
            methodologie: expect.any(String),
            nomDonnees: '',
            producteur: expect.any(String),
            sourceId: 'citepa',
          },
          typeScore: 'fait',
          valeur: 63,
        },
      ],
    });
  });

  test('Demander le score lève une erreur si on est non authentifié', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.referentiels.actions.getScoreIndicatif({
        collectiviteId: 1,
        actionIds: ['cae_1.2.3.3.4'],
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Demander un score calculable', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.4'],
    });

    expect(result).toMatchObject({
      'cae_1.2.3.3.4': {
        actionId: 'cae_1.2.3.3.4',
        indicateurs: [
          {
            indicateurId: expect.any(Number),
            identifiantReferentiel: 'cae_7',
            unite: '%',
            titre: expect.any(String),
          },
        ],
        fait: {
          score: -0.045,
          valeursUtilisees: [
            {
              valeur: 63,
              dateValeur: fixturePourScoreIndicatif.dateValeur,
              sourceLibelle: 'CITEPA',
              sourceMetadonnee: {
                id: expect.any(Number),
                limites: expect.any(String),
                diffuseur: 'Citepa',
                sourceId: 'citepa',
                producteur: expect.any(String),
                nomDonnees: expect.any(String),
                dateVersion: expect.any(String),
                methodologie: expect.any(String),
              },
            },
          ],
        },
        programme: {
          score: 0,
          valeursUtilisees: [
            {
              valeur: 44,
              dateValeur: fixturePourScoreIndicatif.dateValeur,
              sourceLibelle: null,
              sourceMetadonnee: null,
            },
          ],
        },
      },
    });
  });

  test("Demander un score quand il n'est pas encore calculable (par manque de valeurs sélectionnées)", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.1'],
    });

    expect(result).toMatchObject({});
  });

  test('Insérer des valeurs et demander le score', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const exemple2 = {
      collectiviteId: 1,
      actionId: 'cae_1.2.3.3.1',
      identifiantReferentiel: 'cae_6.a',
      dateValeur: '2025-05-29',
      exprScore: `si val(cae_6.a) < limite(cae_6.a) alors 0
        sinon si val(cae_6.a) > cible(cae_6.a) alors 1
        sinon ((val(cae_6.a) - limite(cae_6.a)) * 0.1) / (limite(cae_6.a) - cible(cae_6.a))`,
      objectif: 440, // objectif collectivité < limite (580),
      resultat: 350, // résultat citepa < cible (480)
    };
    const cleanup = await insertFixturePourScoreIndicatif(
      databaseService,
      exemple2
    );
    onTestFinished(() => cleanup());

    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.1'],
    });

    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_6.a'
    );

    expect(result).toMatchObject({
      'cae_1.2.3.3.1': {
        actionId: 'cae_1.2.3.3.1',
        indicateurs: [
          {
            actionId: 'cae_1.2.3.3.1',
            identifiantReferentiel: 'cae_6.a',
            indicateurId,
            optional: false,
            titre: expect.any(String),
            unite: expect.any(String),
          },
        ],
        fait: {
          score: 0,
          valeursUtilisees: [
            {
              dateValeur: '2025-05-29',
              indicateurId,
              sourceLibelle: 'CITEPA',
              sourceMetadonnee: {
                dateVersion: '2023-01-01T00:00:00',
                diffuseur: 'Citepa',
                id: 1,
                limites: '',
                methodologie:
                  'Inventaire GES spatialisé (CITEPA 2023 - année 2021 et CITEPA 2021 - années 2016 et 2018) et périmètre (Banatic 2023)',
                nomDonnees: '',
                producteur: 'Citepa - Territoires en Transitions',
                sourceId: 'citepa',
              },
              valeur: 350,
            },
          ],
        },
        programme: {
          score: 0,
          valeursUtilisees: [
            {
              dateValeur: '2025-05-29',
              indicateurId,
              sourceLibelle: null,
              sourceMetadonnee: null,
              valeur: 440,
            },
          ],
        },
      },
    });
  });
});
