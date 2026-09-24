import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurCollectiviteTable } from '@tet/backend/indicateurs/definitions/indicateur-collectivite.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import {
  deleteActionScoreIndicateurValeursForCollectivite,
  deleteIndicateurValeursForCollectivite,
  fixturePourScoreIndicatif,
  getAuthUserFromUserCredentials,
  getIndicateurIdByIdentifiant,
  getSnbcMetadonneeId,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  insertFixtureAutreActionPourScoreIndicatif,
  insertFixturePourScoreIndicatif,
  insertFixtureScoreAvecExprCible,
  insertIndicateurValeurs,
  TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, isNull } from 'drizzle-orm';

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

  test("Demander un score pour un indicateur marqué non applicable force le résultat à 0, même si des valeurs sont sélectionnées", async () => {
    const caller = router.createCaller({ user: testUser });

    await caller.indicateurs.indicateurs.update({
      indicateurId: indicateurIdCae7,
      collectiviteId: testCollectiviteId,
      indicateurFields: { isApplicable: false },
    });
    onTestFinished(async () => {
      // Supprime la ligne (plutôt que de remettre le flag à false) pour ne
      // pas laisser de référence à l'utilisateur de test via `modified_by`,
      // qui empêcherait sa suppression dans le `afterAll` de la suite.
      await databaseService.db
        .delete(indicateurCollectiviteTable)
        .where(
          and(
            eq(indicateurCollectiviteTable.indicateurId, indicateurIdCae7),
            eq(indicateurCollectiviteTable.collectiviteId, testCollectiviteId)
          )
        );
    });

    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
      actionIds: ['cae_1.2.3.3.4'],
    });

    expect(result).toMatchObject({
      'cae_1.2.3.3.4': {
        fait: { score: 0, valeursUtilisees: [] },
        programme: { score: 0, valeursUtilisees: [] },
      },
    });
  });

  test('Un indicateur non applicable force le score à 0 même pour une formule à seuil où une valeur basse serait "bonne"', async () => {
    const caller = router.createCaller({ user: testUser });

    // Cas réel (proche de te_2.3.1.5.a) : une valeur basse est "bonne" pour
    // cet indicateur. Si on neutralisait l'indicateur non applicable en
    // forçant `val()` à 0 dans la formule, on obtiendrait 1 (100% fait) au
    // lieu du 0% attendu, car 0 < cible. Le résultat doit être forcé à 0
    // sans même évaluer la formule.
    const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
      collectiviteId: testCollectiviteId,
      actionId: fixturePourScoreIndicatif.actionId,
      exprCible: 'si referentiel(cae) alors 160 sinon 0',
      exprScore: `si val(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) < cible(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) alors 1 sinon 0`,
      dateValeur: fixturePourScoreIndicatif.dateValeur,
      resultat: 200,
      objectif: 200,
    });
    onTestFinished(() => cleanup());

    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT
    );
    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: testCollectiviteId,
      indicateurFields: { isApplicable: false },
    });
    // Nettoyage explicite plutôt que de compter sur la suppression en
    // cascade de `cleanup()` ci-dessus : `TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT`
    // est réutilisé par les autres tests de ce fichier, qui partagent
    // `testCollectiviteId` — un `isApplicable: false` qui fuiterait forcerait
    // silencieusement leur score à 0.
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurCollectiviteTable)
        .where(
          and(
            eq(indicateurCollectiviteTable.indicateurId, indicateurId),
            eq(indicateurCollectiviteTable.collectiviteId, testCollectiviteId)
          )
        );
    });

    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
      actionIds: [fixturePourScoreIndicatif.actionId],
    });

    expect(result).toMatchObject({
      [fixturePourScoreIndicatif.actionId]: {
        fait: { score: 0, valeursUtilisees: [] },
        programme: { score: 0, valeursUtilisees: [] },
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

  test('est_suivi(...) évalue à vrai (score à 1) quand une valeur est sélectionnée pour le score', async () => {
    const caller = router.createCaller({ user: testUser });

    // `insertFixtureScoreAvecExprCible` sélectionne déjà la valeur insérée
    // pour le calcul du score (fait et programme).
    const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
      collectiviteId: testCollectiviteId,
      actionId: fixturePourScoreIndicatif.actionId,
      exprCible: 'si referentiel(cae) alors 160 sinon 0',
      exprScore: `si est_suivi(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) alors 1 sinon 0`,
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

  test("est_suivi(...) évalue à faux (score à 0) quand une valeur résultat existe mais n'est pas sélectionnée pour le score", async () => {
    const caller = router.createCaller({ user: testUser });

    const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
      collectiviteId: testCollectiviteId,
      actionId: fixturePourScoreIndicatif.actionId,
      exprCible: 'si referentiel(cae) alors 160 sinon 0',
      exprScore: `si est_suivi(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) alors 1 sinon 0`,
      dateValeur: fixturePourScoreIndicatif.dateValeur,
      resultat: 60,
      objectif: 60,
    });
    onTestFinished(() => cleanup());

    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT
    );

    // retire la sélection tout en conservant la valeur : est_suivi(...) ne se
    // fie qu'à la sélection, pas à la simple existence d'un résultat.
    await deleteActionScoreIndicateurValeursForCollectivite(
      databaseService,
      testCollectiviteId,
      [indicateurId]
    );

    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: testCollectiviteId,
      actionIds: [fixturePourScoreIndicatif.actionId],
    });

    // note : les `valeursUtilisees` de l'action peuvent contenir des valeurs
    // sélectionnées pour un autre indicateur (cae_7, via la fixture de base) —
    // seul le score compte ici.
    expect(result).toMatchObject({
      [fixturePourScoreIndicatif.actionId]: {
        fait: { score: 0 },
        programme: { score: 0 },
      },
    });
  });

  test("est_suivi(...) évalue à faux (score à 0) quand aucune valeur résultat n'existe pour l'indicateur", async () => {
    const caller = router.createCaller({ user: testUser });

    const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
      collectiviteId: testCollectiviteId,
      actionId: fixturePourScoreIndicatif.actionId,
      exprCible: 'si referentiel(cae) alors 160 sinon 0',
      exprScore: `si est_suivi(${TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT}) alors 1 sinon 0`,
      dateValeur: fixturePourScoreIndicatif.dateValeur,
      resultat: 60,
      objectif: 60,
    });
    onTestFinished(() => cleanup());

    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT
    );

    // supprime toute valeur (et sa sélection, en cascade) pour simuler
    // l'absence de suivi
    await deleteIndicateurValeursForCollectivite(
      databaseService,
      testCollectiviteId,
      [indicateurId]
    );

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

  describe('progression_snbc(...) et reduction(...)', () => {
    const ID = TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT;
    const METADONNEE_CITEPA = 1;

    // formule + valeur `fait` sélectionnée : 90 en 2025 (citepa) ; la valeur
    // `programme` (objectif 60, collectivité) sert à vérifier qu'elle donne
    // `null` (pas d'année utilisée pour les objectifs)
    const setup = async (exprScore: string) => {
      const cleanup = await insertFixtureScoreAvecExprCible(databaseService, {
        collectiviteId: testCollectiviteId,
        actionId: fixturePourScoreIndicatif.actionId,
        exprCible: 'si referentiel(cae) alors 160 sinon 0',
        exprScore,
        dateValeur: fixturePourScoreIndicatif.dateValeur,
        resultat: 90,
        objectif: 60,
      });
      onTestFinished(() => cleanup());
      const indicateurId = await getIndicateurIdByIdentifiant(
        databaseService,
        ID
      );
      const snbcId = await getSnbcMetadonneeId(databaseService);
      const insert = (
        valeurs: Parameters<typeof insertIndicateurValeurs>[1]['valeurs']
      ) =>
        insertIndicateurValeurs(databaseService, {
          indicateurId,
          collectiviteId: testCollectiviteId,
          valeurs,
        });
      return { indicateurId, snbcId, insert };
    };

    const getScore = async () => {
      const caller = router.createCaller({ user: testUser });
      const result = await caller.referentiels.actions.getScoreIndicatif({
        collectiviteId: testCollectiviteId,
        actionIds: [fixturePourScoreIndicatif.actionId],
      });
      return result[fixturePourScoreIndicatif.actionId];
    };

    test('progression_snbc : score fait de 0.5, programme null', async () => {
      const { snbcId, insert } = await setup(`progression_snbc(${ID})`);
      // 2015 à une date qui n'est pas un 1er janvier
      await insert([
        { dateValeur: '2015-06-15', metadonneeId: snbcId, objectif: 100 },
        { dateValeur: '2025-01-01', metadonneeId: snbcId, objectif: 80 },
      ]);

      const score = await getScore();
      expect(score.fait?.score).toBeCloseTo(0.5);
      expect(score.programme).toBeNull();
    });

    test('progression_snbc : valeurs snbc manquantes ou valeurDepart = valeurAttendue', async () => {
      const { snbcId, insert } = await setup(
        `min(1, progression_snbc(${ID}))`
      );
      expect((await getScore()).fait).toBeNull();

      await insert([
        { dateValeur: '2015-01-01', metadonneeId: snbcId, objectif: 80 },
        { dateValeur: '2025-01-01', metadonneeId: snbcId, objectif: 80 },
      ]);
      expect((await getScore()).fait).toBeNull();
    });

    test('reduction : valeurDepart de la collectivité', async () => {
      const { insert } = await setup(`reduction(${ID}, 2015, 2030, 0.4)`);
      await insert([
        { dateValeur: '2015-01-01', metadonneeId: null, resultat: 100 },
      ]);

      const score = await getScore();
      expect(score.fait?.score).toBeCloseTo(0.375);
      expect(score.programme).toBeNull();
    });

    test("reduction : repli sur une source open data, puis null sans aucune valeur de départ", async () => {
      const { insert } = await setup(`reduction(${ID}, 2015, 2030, 0.4)`);
      expect((await getScore()).fait).toBeNull();

      await insert([
        {
          dateValeur: '2015-01-01',
          metadonneeId: METADONNEE_CITEPA,
          resultat: 100,
        },
      ]);
      expect((await getScore()).fait?.score).toBeCloseTo(0.375);
    });

    test('reduction : la trajectoire reste à la cible après anneeCible', async () => {
      const { insert } = await setup(`reduction(${ID}, 2015, 2020, 0.4)`);
      await insert([
        { dateValeur: '2015-01-01', metadonneeId: null, resultat: 100 },
      ]);

      // valeurAttendue = 60 (cible), résultat 90 : (100 - 90) / (100 - 60)
      expect((await getScore()).fait?.score).toBeCloseTo(0.25);
    });

    test("l'année utilisée dépend de l'action (contexte non partagé)", async () => {
      const autreActionId = 'cae_1.2.3.3.5';
      const exprScore = `reduction(${ID}, 2015, 2030, 0.4)`;
      const { indicateurId, insert } = await setup(exprScore);
      const [, fait2030] = await insert([
        { dateValeur: '2015-01-01', metadonneeId: null, resultat: 100 },
        { dateValeur: '2030-01-01', metadonneeId: METADONNEE_CITEPA, resultat: 90 },
      ]);
      const [programme] = await databaseService.db
        .select({ id: indicateurValeurTable.id })
        .from(indicateurValeurTable)
        .where(
          and(
            eq(indicateurValeurTable.indicateurId, indicateurId),
            eq(indicateurValeurTable.collectiviteId, testCollectiviteId),
            eq(indicateurValeurTable.dateValeur, fixturePourScoreIndicatif.dateValeur),
            isNull(indicateurValeurTable.metadonneeId)
          )
        );
      const cleanupAutreAction = await insertFixtureAutreActionPourScoreIndicatif(
        databaseService,
        {
          actionId: autreActionId,
          collectiviteId: testCollectiviteId,
          indicateurId,
          exprScore,
          valeurs: [
            { id: programme.id, metadonneeId: null },
            { id: fait2030.id, metadonneeId: METADONNEE_CITEPA },
          ],
        }
      );
      onTestFinished(() => cleanupAutreAction());

      const caller = router.createCaller({ user: testUser });
      const result = await caller.referentiels.actions.getScoreIndicatif({
        collectiviteId: testCollectiviteId,
        actionIds: [fixturePourScoreIndicatif.actionId, autreActionId],
      });

      // 2025 : avancement 2/3, attendue 73.33 ; 2030 : avancement 1, attendue 60
      expect(result[fixturePourScoreIndicatif.actionId].fait?.score).toBeCloseTo(
        0.375
      );
      expect(result[autreActionId].fait?.score).toBeCloseTo(0.25);
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
