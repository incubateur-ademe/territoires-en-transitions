import { CollectivitePreferencesService } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.service';
import { personnalisationRegleTable } from '@tet/backend/collectivites/personnalisations/models/personnalisation-regle.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import type { PersonnalisationQuestionReponse } from '@tet/domain/collectivites';
import { referentielIdEnumValues } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import {
  addTestPersonnalisationData,
  addTestQuestionCollectiviteNonConcernee,
  addTestQuestionsExprVisible,
  TestPersonnalisationData,
} from '../personnalisations.test-fixture';

describe('Lister les questions de personnalisation', () => {
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let testData: TestPersonnalisationData;

  beforeAll(async () => {
    const app = await getTestApp({
      overrides: (builder) => {
        builder.overrideProvider(CollectivitePreferencesService).useValue({
          getEnabledReferentiels: vi
            .fn()
            .mockResolvedValue([...referentielIdEnumValues]),
        });
      },
    });
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
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
        });

      const questions = testData.isolateFixtureQuestions(
        result.map((r) => r.question)
      );
      expect(questions).toHaveLength(testData.fixtureQuestionIds.length);

      const questionChoix = questions.find(
        (q) => q.id === testData.questionChoixId
      );
      expect(questionChoix?.choix).toHaveLength(1);
      expect(questionChoix?.choix?.[0].id).toBe(testData.choixId);
      expect(questionChoix?.choix?.[0].formulation).toBe('Choix 1');
    });

    test('Filtrer par collectiviteId exclut les questions pour lesquelles la collectivité est non concernée (suivant son type)', async () => {
      const { questionId, cleanup } =
        await addTestQuestionCollectiviteNonConcernee(databaseService, {
          thematiqueId: testData.thematiqueId,
          collectiviteType: testData.collectivite.type,
        });
      onTestFinished(cleanup);

      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          thematiqueIds: [testData.thematiqueId],
        });

      expect(result.map((r) => r.question.id)).not.toContain(questionId);
      const questions = testData.isolateFixtureQuestions(
        result.map((r) => r.question)
      );
      expect(questions).toHaveLength(testData.fixtureQuestionIds.length);
    });

    test('Filtrer par thematiqueId', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          thematiqueIds: [testData.thematiqueId],
        });

      const questions = testData.isolateFixtureQuestions(
        result.map((r) => r.question)
      );
      expect(questions).toHaveLength(testData.fixtureQuestionIds.length);
    });

    test('Filtrer par questionIds', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          questionIds: [testData.questionBinaireId, testData.questionChoixId],
        });

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.question.id).sort()).toEqual(
        [testData.questionBinaireId, testData.questionChoixId].sort()
      );
    });

    test('Filtrer par referentielIds : ne retient que les questions liées aux mesures de ces référentiels', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          referentielIds: ['te'],
        });

      const questions = testData.isolateFixtureQuestions(
        result.map((r) => r.question)
      );
      expect(questions).toHaveLength(3);
      expect(questions.map((q) => q.id).sort()).toEqual(
        [
          testData.questionBinaireId,
          testData.questionChoixId,
          testData.questionProportionId,
        ].sort()
      );
    });

    test('Filtrer par referentiel et thématique', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const avecTeTest =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          referentielIds: ['te'],
          thematiqueIds: [testData.thematiqueId],
        });
      const questionsTeTest = testData.isolateFixtureQuestions(
        avecTeTest.map((r) => r.question)
      );
      expect(questionsTeTest).toHaveLength(3);

      const avecCaeSeulement =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          referentielIds: ['cae'],
          thematiqueIds: [testData.thematiqueId],
        });
      const questionsCae = testData.isolateFixtureQuestions(
        avecCaeSeulement.map((r) => r.question)
      );
      // aucune question de la fixture n'est liée à une mesure cae
      expect(questionsCae).toHaveLength(0);
    });

    test("Filtrer par referentielIds exclut les questions liées uniquement à d'autres référentiels", async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      // la proportion n'est liée à aucune mesure → absente si filtre cae
      const result =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          referentielIds: ['cae'],
        });

      const questions = testData.isolateFixtureQuestions(
        result.map((r) => r.question)
      );
      expect(questions).toHaveLength(0);
    });

    test('Filtrer par actionIds', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const resultAction1 =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          actionIds: [testData.questionActionLinks[0].actionId],
        });
      expect(resultAction1).toHaveLength(1);
      expect(resultAction1[0].question.id).toBe(testData.questionBinaireId);

      const resultAction2 =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          actionIds: [testData.questionActionLinks[2].actionId],
        });
      expect(resultAction2).toHaveLength(1);
      expect(resultAction2[0].question.id).toBe(testData.questionChoixId);

      const resultBoth =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          actionIds: [
            testData.questionActionLinks[0].actionId,
            testData.questionActionLinks[2].actionId,
          ],
        });
      expect(resultBoth).toHaveLength(2);
      expect(resultBoth.map((r) => r.question.id).sort()).toEqual(
        [testData.questionBinaireId, testData.questionChoixId].sort()
      );
    });

    test('Retire des actionIds les mesures désactivées par la personnalisation', async () => {
      const actionId = testData.questionActionLinks[0].actionId;
      const questionId = testData.questionBinaireId;

      await databaseService.db.insert(personnalisationRegleTable).values({
        actionId,
        type: 'desactivation',
        formule: `reponse(${questionId}, OUI)`,
        description:
          'test désactivation pour filtre actionIds (liste questions)',
      });

      onTestFinished(async () => {
        await databaseService.db
          .delete(personnalisationRegleTable)
          .where(
            and(
              eq(personnalisationRegleTable.actionId, actionId),
              eq(personnalisationRegleTable.type, 'desactivation')
            )
          );
      });

      const caller = router.createCaller({ user: testData.userCredentials });

      const avantReponse =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          questionIds: [questionId],
        });
      expect(avantReponse[0].question.actionIds).toContain(actionId);

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId,
        reponse: true,
      });

      const apresReponse =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          questionIds: [questionId],
        });
      expect(apresReponse[0].question.actionIds ?? []).not.toContain(actionId);
    });

    test('Un utilisateur avec droits de lecture peut lister les questions', async () => {
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: testData.collectivite.id,
        role: CollectiviteRole.LECTURE,
      });

      try {
        const readOnlyCaller = router.createCaller({
          user: getAuthUserFromUserCredentials(user),
        });

        const result =
          await readOnlyCaller.collectivites.personnalisations.listQuestionsReponses(
            {
              collectiviteId: testData.collectivite.id,
            }
          );
        expect(result.length).toBeGreaterThanOrEqual(0);
      } finally {
        await cleanup();
      }
    });
  });

  describe('Filtrage exprVisible', () => {
    test('pas de réponse ou réponse OUI sur la question de référence : la question conditionnelle est masquée', async () => {
      const { questionReferenceId, questionConditionnelleId, cleanup } =
        await addTestQuestionsExprVisible(databaseService, {
          thematiqueId: testData.thematiqueId,
          collectiviteType: testData.collectivite.type,
        });
      onTestFinished(cleanup);

      const caller = router.createCaller({ user: testData.userCredentials });

      const input = {
        collectiviteId: testData.collectivite.id,
        questionIds: [questionReferenceId, questionConditionnelleId],
      };

      const result1 =
        await caller.collectivites.personnalisations.listQuestionsReponses(
          input
        );
      expect(result1.map((r) => r.question.id)).toEqual([questionReferenceId]);

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: questionReferenceId,
        reponse: true,
      });

      const result2 =
        await caller.collectivites.personnalisations.listQuestionsReponses(
          input
        );
      expect(result2.map((r) => r.question.id)).toEqual([questionReferenceId]);
    });

    test('réponse NON sur la question de référence : affiche la question conditionnelle', async () => {
      const { questionReferenceId, questionConditionnelleId, cleanup } =
        await addTestQuestionsExprVisible(databaseService, {
          thematiqueId: testData.thematiqueId,
          collectiviteType: testData.collectivite.type,
        });
      onTestFinished(cleanup);

      const caller = router.createCaller({ user: testData.userCredentials });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: questionReferenceId,
        reponse: false,
      });

      const result =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          questionIds: [questionReferenceId, questionConditionnelleId],
        });

      expect(result.map((r) => r.question.id).sort()).toEqual(
        [questionReferenceId, questionConditionnelleId].sort()
      );
    });
  });

  describe('Réponses jointes aux questions', () => {
    test('paires question / réponse', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listQuestionsReponses({
          collectiviteId: testData.collectivite.id,
          thematiqueIds: [testData.thematiqueId],
        });

      expect(result.length).toBeGreaterThan(0);
      const row = result[0] as PersonnalisationQuestionReponse;
      expect(row.question).toBeDefined();
      expect('reponse' in row).toBe(true);
    });
  });
});
