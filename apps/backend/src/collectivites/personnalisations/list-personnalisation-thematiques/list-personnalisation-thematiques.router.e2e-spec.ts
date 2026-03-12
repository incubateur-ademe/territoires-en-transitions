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
