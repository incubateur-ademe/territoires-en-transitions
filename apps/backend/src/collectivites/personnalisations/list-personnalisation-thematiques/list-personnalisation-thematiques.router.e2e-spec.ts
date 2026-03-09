import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import type { PersonnalisationThematique } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import {
  addTestPersonnalisationData,
  TestPersonnalisationData,
} from '../personnalisations.test-fixture';

describe('Lister les thématiques de personnalisation', () => {
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let testData: TestPersonnalisationData;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);
    testData = await addTestPersonnalisationData(databaseService);
  });

  afterAll(async () => {
    if (testData) await testData.cleanup();
  });

  afterEach(async () => {
    if (testData) await testData.cleanupReponses();
  });

  const getFixtureThematique = (thematiques: PersonnalisationThematique[]) =>
    thematiques.find((t) => t.id === testData.thematiqueId);

  describe('List Personnalisation Thematiques - Cas de succès', () => {
    test('Retourne la thématique de test avec les propriétés attendues', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique).toBeDefined();
      expect(thematique?.id).toBe(testData.thematiqueId);
      expect(thematique?.nom).toBe('Thématique de test');
      expect(thematique?.questionsCount).toBe(3);
      expect(thematique?.reponsesCount).toBe(0);
      expect(thematique?.referentiels).toContain('te-test');
      expect(thematique?.isComplete).toBe(false);
    });

    test('isComplete est false sans réponses', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique?.isComplete).toBe(false);
    });

    test('isComplete est false si il manque une réponse', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
      });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionProportionId,
        reponse: 0.5,
      });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique?.questionsCount).toBe(3);
      expect(thematique?.reponsesCount).toBe(2);
      expect(thematique?.isComplete).toBe(false);
    });

    test('isComplete est false si il manque une réponse (non nulle)', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
      });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionProportionId,
        reponse: 0.5,
      });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionChoixId,
        reponse: null,
      });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique?.questionsCount).toBe(3);
      expect(thematique?.reponsesCount).toBe(2);
      expect(thematique?.isComplete).toBe(false);
    });

    test('isComplete est true lorsque toutes les questions ont une réponse', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
      });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionProportionId,
        reponse: 0.5,
      });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionChoixId,
        reponse: testData.choixId,
      });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique?.isComplete).toBe(true);
    });

    test('referentiels contient te-test pour la thématique liée aux actions', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique?.referentiels).toContain('te-test');
    });

    test('Filtre actionIds : ne compte que les questions liées à ces mesures', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const avecUneMesure =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          actionIds: [testData.actionId1],
        });
      expect(getFixtureThematique(avecUneMesure)?.questionsCount).toBe(1);

      const avecDeuxMesures =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          actionIds: [testData.actionId1, testData.actionId2],
        });
      expect(getFixtureThematique(avecDeuxMesures)?.questionsCount).toBe(2);
    });

    test('Filtre actionIds : les réponses ne portent que sur les questions filtrées', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
      });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionChoixId,
        reponse: testData.choixId,
      });

      const filtreAction1 =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          actionIds: [testData.actionId1],
        });
      const thematique1 = getFixtureThematique(filtreAction1);
      expect(thematique1?.questionsCount).toBe(1);
      expect(thematique1?.reponsesCount).toBe(1);
      expect(thematique1?.isComplete).toBe(true);

      const filtreDeuxMesures =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          actionIds: [testData.actionId1, testData.actionId2],
        });
      const thematique2 = getFixtureThematique(filtreDeuxMesures);
      expect(thematique2?.questionsCount).toBe(2);
      expect(thematique2?.reponsesCount).toBe(2);
      expect(thematique2?.isComplete).toBe(true);
    });

    test('Filtre actionIds sans mesure connue : la thématique de test disparaît', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          actionIds: ['mesure-inexistante-pour-filtre'],
        });

      expect(getFixtureThematique(result)).toBeUndefined();
    });

    test('Filtre thematiqueIds : ne retient que les thématiques demandées', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const avecThematique =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          thematiqueIds: [testData.thematiqueId],
        });
      const thematique = getFixtureThematique(avecThematique);
      expect(thematique).toBeDefined();
      expect(thematique?.nom).toBe('Thématique de test');

      const sansCorrespondance =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          thematiqueIds: ['thematique-inexistante-pour-filtre'],
        });
      expect(getFixtureThematique(sansCorrespondance)).toBeUndefined();
    });

    test('Filtre referentielIds : ne retient que les thématiques liées à ces référentiels ou à aucun référentiel', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const avecTeTest =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          referentielIds: ['te-test'],
        });
      const thematiqueTeTest = getFixtureThematique(avecTeTest);
      expect(thematiqueTeTest).toBeDefined();
      expect(thematiqueTeTest?.referentiels).toContain('te-test');
      // binaire + choix liés à te-test, proportion sans lien mesure
      expect(thematiqueTeTest?.questionsCount).toBe(3);
      expect(thematiqueTeTest?.reponsesCount).toBe(0);

      const avecCaeSeulement =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          referentielIds: ['cae'],
        });
      const thematiqueCae = getFixtureThematique(avecCaeSeulement);
      expect(thematiqueCae).toBeDefined();
      // seule la question sans lien mesure (proportion) reste pour ce filtre
      expect(thematiqueCae?.questionsCount).toBe(1);
      expect(thematiqueCae?.reponsesCount).toBe(0);
    });

    test('Un utilisateur avec droits de lecture peut lister les thématiques', async () => {
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: testData.collectivite.id,
        role: CollectiviteRole.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const readOnlyCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(user),
      });

      const result =
        await readOnlyCaller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique).toBeDefined();
      expect(thematique?.id).toBe(testData.thematiqueId);
    });
  });

  describe("List Personnalisation Thematiques - Cas d'erreur", () => {
    test('Un collectiviteId invalide retourne une erreur de validation', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.listThematiques({
          collectiviteId: -1,
        })
      ).rejects.toThrow();
    });
  });
});
