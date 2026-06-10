import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  fixturePourScoreIndicatif,
  getAuthUserFromUserCredentials,
  getIndicateurIdByIdentifiant,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  insertFixturePourScoreIndicatif,
  insertFixtureScoreAvecExprCible,
  TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';

/** Action TE présente en seed, utilisée pour les tests referentiel(te_…). */
const TE_ACTION_ID = 'te_2.2.5';

describe('ScoreIndicatifRouter', () => {
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let databaseService: DatabaseService;
  let indicateurIdCae7: number;
  let app: INestApplication;
  let testCollectiviteId: number;
  let cleanupScoreIndicatifFixture: (() => Promise<void>) | undefined;
  let cleanupCollectivite: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const collectiviteResult = await addTestCollectiviteAndUser(
      databaseService,
      { user: { role: CollectiviteRole.ADMIN } }
    );
    testCollectiviteId = collectiviteResult.collectivite.id;
    testUser = getAuthUserFromUserCredentials(collectiviteResult.user);
    cleanupCollectivite = collectiviteResult.cleanup;

    // insert test data
    cleanupScoreIndicatifFixture = await insertFixturePourScoreIndicatif(
      databaseService,
      { ...fixturePourScoreIndicatif, collectiviteId: testCollectiviteId }
    );

    indicateurIdCae7 = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_7'
    );
  });

  afterAll(async () => {
    // L'ordre importe : supprimer d'abord les valeurs d'indicateur (qui référencent
    // la collectivité via FK non-cascadante) avant de supprimer la collectivité.
    if (cleanupScoreIndicatifFixture) {
      await cleanupScoreIndicatifFixture();
    }
    if (cleanupCollectivite) {
      await cleanupCollectivite();
    }
    await app.close();
  });

  test('Lire les valeurs utilisables lève une erreur si on est non authentifié', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.referentiels.actions.getValeursUtilisables({
        collectiviteId: testCollectiviteId,
        actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Lire les valeurs utilisables pour le calcul du score indicatif', async () => {
    const caller = router.createCaller({ user: testUser });
    const result = await caller.referentiels.actions.getValeursUtilisables({
      collectiviteId: testCollectiviteId,
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
        collectiviteId: testCollectiviteId,
        actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Lire les valeurs utilisées pour le calcul du score indicatif', async () => {
    const caller = router.createCaller({ user: testUser });
    const result = await caller.referentiels.actions.getValeursUtilisees({
      collectiviteId: testCollectiviteId,
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
        collectiviteId: testCollectiviteId,
        actionIds: ['cae_1.2.3.3.4'],
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Demander un score calculable', async () => {
    const caller = router.createCaller({ user: testUser });
    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
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
    const caller = router.createCaller({ user: testUser });
    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
      actionIds: ['cae_1.2.3.3.1'],
    });

    expect(result).toMatchObject({});
  });

  test("Demander un score dépendant du contexte référentiel : contexte dérivé de l'actionId (évalué à true)", async () => {
    const caller = router.createCaller({ user: testUser });

    // L'exprCible vaut 65 pour cae, 0 sinon.
    // exprScore : si val > cible alors 1 sinon 0
    //   → val(60) > cible(65) = false → score 0  ✓ (referentiel(cae) = true)
    //   → val(60) > cible(0)  = true  → score 1  ✗ (si referentiel(cae) était false)
    const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
      collectiviteId: testCollectiviteId,
      actionId: fixturePourScoreIndicatif.actionId,
      exprCible: 'si referentiel(cae) alors 65 sinon 0',
      exprScore: `si val(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) > cible(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) alors 1 sinon 0`,
      dateValeur: fixturePourScoreIndicatif.dateValeur,
      resultat: 60,
      objectif: 60,
    });
    onTestFinished(() => cleanup());

    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
      actionIds: [fixturePourScoreIndicatif.actionId],
    });

    expect(result).toMatchObject({
      [fixturePourScoreIndicatif.actionId]: {
        fait: { score: 0 },
        programme: { score: 0 },
      },
    });
  });

  test("Demander un score dépendant du contexte référentiel : contexte dérivé de l'actionId (évalué à false)", async () => {
    const caller = router.createCaller({ user: testUser });

    // L'exprCible vaut 65 pour te, 0 sinon.
    // exprScore : si val > cible alors 1 sinon 0
    //   → val(60) > cible(0)  = true  → score 1  ✓ (referentiel(te) = false sur action CAE)
    //   → val(60) > cible(65) = false → score 0  ✗ (si referentiel(te) était true)
    const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
      collectiviteId: testCollectiviteId,
      actionId: fixturePourScoreIndicatif.actionId,
      exprCible: 'si referentiel(te) alors 65 sinon 0',
      exprScore: `si val(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) > cible(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) alors 1 sinon 0`,
      dateValeur: fixturePourScoreIndicatif.dateValeur,
      resultat: 60,
      objectif: 60,
    });
    onTestFinished(() => cleanup());

    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
      actionIds: [fixturePourScoreIndicatif.actionId],
    });

    expect(result).toMatchObject({
      [fixturePourScoreIndicatif.actionId]: {
        fait: { score: 1 },
        programme: { score: 1 },
      },
    });
  });

  test("Demander un score dépendant du contexte référentiel : contexte dérivé de l'actionId TE (évalué à true)", async () => {
    const caller = router.createCaller({ user: testUser });
    // L'exprCible vaut 65 pour te, 0 sinon.
    // exprScore : si val > cible alors 1 sinon 0
    //   → val(60) > cible(65) = false → score 0  ✓ (referentiel(te) = true sur action TE)
    //   → val(60) > cible(0)  = true  → score 1  ✗ (si referentiel(te) était false)
    const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
      collectiviteId: testCollectiviteId,
      actionId: TE_ACTION_ID,
      exprCible: 'si referentiel(te) alors 65 sinon 0',
      exprScore: `si val(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) > cible(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) alors 1 sinon 0`,
      dateValeur: fixturePourScoreIndicatif.dateValeur,
      resultat: 60,
      objectif: 60,
    });
    onTestFinished(() => cleanup());
    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
      actionIds: [TE_ACTION_ID],
    });
    expect(result).toMatchObject({
      [TE_ACTION_ID]: {
        fait: { score: 0 },
        programme: { score: 0 },
      },
    });
  });

  test('Demander un score dépendant du contexte référentiel : vérification de la version (version minimale atteinte)', async () => {
    const caller = router.createCaller({ user: testUser });
    const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
      collectiviteId: testCollectiviteId,
      actionId: TE_ACTION_ID,
      exprCible: 'si referentiel(te_0.0.1) alors 65 sinon 0',
      exprScore: `si val(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) > cible(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) alors 1 sinon 0`,
      dateValeur: fixturePourScoreIndicatif.dateValeur,
      resultat: 60,
      objectif: 60,
    });
    onTestFinished(() => cleanup());

    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
      actionIds: [TE_ACTION_ID],
    });

    expect(result).toMatchObject({
      [TE_ACTION_ID]: {
        fait: { score: 0 },
        programme: { score: 0 },
      },
    });
  });

  test('Demander un score dépendant du contexte référentiel : vérification de la version (version minimale non atteinte)', async () => {
    const caller = router.createCaller({ user: testUser });
    const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
      collectiviteId: testCollectiviteId,
      actionId: TE_ACTION_ID,
      exprCible: 'si referentiel(te_99.99.999) alors 65 sinon 0',
      exprScore: `si val(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) > cible(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) alors 1 sinon 0`,
      dateValeur: fixturePourScoreIndicatif.dateValeur,
      resultat: 60,
      objectif: 60,
    });
    onTestFinished(() => cleanup());

    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
      actionIds: [TE_ACTION_ID],
    });

    expect(result).toMatchObject({
      [TE_ACTION_ID]: {
        fait: { score: 1 },
        programme: { score: 1 },
      },
    });
  });

  test('Insérer des valeurs et demander le score', async () => {
    const caller = router.createCaller({ user: testUser });

    const exemple2 = {
      collectiviteId: testCollectiviteId,
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
      collectiviteId: testCollectiviteId,
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

  test('getScoreIndicatif rejette un mélange de référentiels', async () => {
    const caller = router.createCaller({ user: testUser });
    await expect(
      caller.referentiels.actions.getScoreIndicatif({
        collectiviteId: testCollectiviteId,
        actionIds: ['cae_1.2.3.3.4', TE_ACTION_ID],
      })
    ).rejects.toThrow(/plusieurs référentiels/);
  });
});
