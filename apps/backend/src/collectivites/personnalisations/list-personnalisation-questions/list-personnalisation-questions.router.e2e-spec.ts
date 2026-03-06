import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import {
  addTestPersonnalisationData,
  TestPersonnalisationData,
} from '../personnalisations.test-fixture';

describe('Lister les questions de personnalisation', () => {
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

  describe('List Questions - Cas de succès', () => {
    test('Retourne les questions créées par le fixture avec leurs choix', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listQuestions();

      const questions = result.filter((q) =>
        [
          testData.questionBinaireId,
          testData.questionProportionId,
          testData.questionChoixId,
        ].includes(q.id)
      );
      expect(questions).toHaveLength(3);

      const questionChoix = questions.find(
        (q) => q.id === testData.questionChoixId
      );
      expect(questionChoix?.choix).toHaveLength(1);
      expect(questionChoix?.choix?.[0].id).toBe(testData.choixId);
      expect(questionChoix?.choix?.[0].formulation).toBe('Choix 1');
    });

    test('Filtre par thematiqueId', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listQuestions(
        {
          thematiqueId: testData.thematiqueId,
        }
      );

      const questions = result.filter((q) =>
        [
          testData.questionBinaireId,
          testData.questionProportionId,
          testData.questionChoixId,
        ].includes(q.id)
      );
      expect(questions).toHaveLength(3);
    });

    test('Filtre par questionIds', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listQuestions(
        {
          questionIds: [testData.questionBinaireId, testData.questionChoixId],
        }
      );

      expect(result).toHaveLength(2);
      expect(result.map((q) => q.id).sort()).toEqual(
        [testData.questionBinaireId, testData.questionChoixId].sort()
      );
    });

    test('Filtre par actionIds', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      // actionId1 est lié à questionBinaire, actionId2 à questionChoix
      const resultAction1 =
        await caller.collectivites.personnalisations.listQuestions({
          actionIds: [testData.actionId1],
        });
      expect(resultAction1).toHaveLength(1);
      expect(resultAction1[0].id).toBe(testData.questionBinaireId);

      const resultAction2 =
        await caller.collectivites.personnalisations.listQuestions({
          actionIds: [testData.actionId2],
        });
      expect(resultAction2).toHaveLength(1);
      expect(resultAction2[0].id).toBe(testData.questionChoixId);

      const resultBoth =
        await caller.collectivites.personnalisations.listQuestions({
          actionIds: [testData.actionId1, testData.actionId2],
        });
      expect(resultBoth).toHaveLength(2);
      expect(resultBoth.map((q) => q.id).sort()).toEqual(
        [testData.questionBinaireId, testData.questionChoixId].sort()
      );
    });

    test('Un utilisateur avec droits de lecture peut lister les questions', async () => {
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: testData.collectivite.id,
        accessLevel: CollectiviteRole.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const readOnlyCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(user),
      });

      const result =
        await readOnlyCaller.collectivites.personnalisations.listQuestions();

      const questions = result.filter((q) =>
        [testData.questionBinaireId, testData.questionProportionId].includes(
          q.id
        )
      );
      expect(questions.length).toBeGreaterThanOrEqual(2);
    });
  });
});
