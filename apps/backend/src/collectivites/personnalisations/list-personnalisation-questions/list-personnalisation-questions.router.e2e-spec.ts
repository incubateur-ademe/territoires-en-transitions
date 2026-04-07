import { CollectivitePreferencesService } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.service';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import type {
  PersonnalisationQuestionReponse,
  PersonnalisationReponse,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import { referentielIdEnumValues } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import {
  addTestPersonnalisationData,
  addTestQuestionCollectiviteNonConcernee,
  addTestQuestionsExprVisible,
  TestPersonnalisationData,
} from '../personnalisations.test-fixture';

type ListQuestionsUnion =
  | QuestionWithChoices[]
  | PersonnalisationQuestionReponse[]
  | PersonnalisationReponse[];

/** Résultat tRPC quand `mode === 'questions'` (le routeur est typé en union sur tous les modes). */
function asQuestionWithChoicesList(
  result: ListQuestionsUnion
): QuestionWithChoices[] {
  return result as QuestionWithChoices[];
}

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

      const result = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
        })
      );

      const questions = testData.isolateFixtureQuestions(result);
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

      const result = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          collectiviteId: testData.collectivite.id,
          thematiqueIds: [testData.thematiqueId],
        })
      );

      expect(result.map((q) => q.id)).not.toContain(questionId);
      const questions = testData.isolateFixtureQuestions(result);
      expect(questions).toHaveLength(testData.fixtureQuestionIds.length);
    });

    test('Sans collectiviteId retourne toutes les questions y compris non concernées', async () => {
      const { questionId, cleanup } =
        await addTestQuestionCollectiviteNonConcernee(databaseService, {
          thematiqueId: testData.thematiqueId,
          collectiviteType: testData.collectivite.type,
        });
      onTestFinished(cleanup);

      const caller = router.createCaller({ user: testData.userCredentials });

      const result = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          thematiqueIds: [testData.thematiqueId],
        })
      );

      const allFixtureQuestionIds = [
        ...testData.fixtureQuestionIds,
        questionId,
      ];
      const fixtureQuestions = result.filter((q) =>
        allFixtureQuestionIds.includes(q.id)
      );
      expect(fixtureQuestions).toHaveLength(
        testData.fixtureQuestionIds.length + 1
      );
    });

    test('Filtrer par thematiqueId', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          thematiqueIds: [testData.thematiqueId],
        })
      );

      const questions = testData.isolateFixtureQuestions(result);
      expect(questions).toHaveLength(testData.fixtureQuestionIds.length);
    });

    test('Filtrer par questionIds', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          questionIds: [testData.questionBinaireId, testData.questionChoixId],
        })
      );

      expect(result).toHaveLength(2);
      expect(result.map((q) => q.id).sort()).toEqual(
        [testData.questionBinaireId, testData.questionChoixId].sort()
      );
    });

    test('Filtrer par referentielIds : ne retient que les questions liées aux mesures de ces référentiels', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          referentielIds: ['te'],
        })
      );

      const questions = testData.isolateFixtureQuestions(result);
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

      const avecTeTest = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          collectiviteId: testData.collectivite.id,
          referentielIds: ['te'],
          thematiqueIds: [testData.thematiqueId],
        })
      );
      const questionsTeTest = testData.isolateFixtureQuestions(avecTeTest);
      expect(questionsTeTest).toHaveLength(3);

      const avecCaeSeulement = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          collectiviteId: testData.collectivite.id,
          referentielIds: ['cae'],
          thematiqueIds: [testData.thematiqueId],
        })
      );
      const questionsCae = testData.isolateFixtureQuestions(avecCaeSeulement);
      // aucune question de la fixture n'est liée à une mesure cae
      expect(questionsCae).toHaveLength(0);
    });

    test("Filtrer par referentielIds exclut les questions liées uniquement à d'autres référentiels", async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      // la proportion n'est liée à aucune mesure → absente si filtre cae
      const result = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          referentielIds: ['cae'],
        })
      );

      const questions = testData.isolateFixtureQuestions(result);
      expect(questions).toHaveLength(0);
    });

    test('Filtrer par actionIds', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      // actionId1 est lié à questionBinaire, actionId2 à questionChoix
      const resultAction1 = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          actionIds: [testData.actionId1],
        })
      );
      expect(resultAction1).toHaveLength(1);
      expect(resultAction1[0].id).toBe(testData.questionBinaireId);

      const resultAction2 = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          actionIds: [testData.actionId2],
        })
      );
      expect(resultAction2).toHaveLength(1);
      expect(resultAction2[0].id).toBe(testData.questionChoixId);

      const resultBoth = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          actionIds: [testData.actionId1, testData.actionId2],
        })
      );
      expect(resultBoth).toHaveLength(2);
      expect(resultBoth.map((q) => q.id).sort()).toEqual(
        [testData.questionBinaireId, testData.questionChoixId].sort()
      );
    });

    test('Un utilisateur avec droits de lecture peut lister les questions', async () => {
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

      const result = asQuestionWithChoicesList(
        await readOnlyCaller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
        })
      );
      expect(result.length).toBeGreaterThanOrEqual(0);
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
        mode: 'questions' as const,
        collectiviteId: testData.collectivite.id,
        questionIds: [questionReferenceId, questionConditionnelleId],
      };

      const result1 = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions(input)
      );
      expect(result1.map((q) => q.id)).toEqual([questionReferenceId]);

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: questionReferenceId,
        reponse: true,
      });

      const result2 = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions(input)
      );
      expect(result2.map((q) => q.id)).toEqual([questionReferenceId]);
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

      const result = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          collectiviteId: testData.collectivite.id,
          questionIds: [questionReferenceId, questionConditionnelleId],
        })
      );

      expect(result.map((q) => q.id).sort()).toEqual(
        [questionReferenceId, questionConditionnelleId].sort()
      );
    });

    test('sans collectiviteId : ne filtre pas (les deux questions sont retournées)', async () => {
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
        reponse: true,
      });

      const result = asQuestionWithChoicesList(
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          questionIds: [questionReferenceId, questionConditionnelleId],
        })
      );

      expect(result).toHaveLength(2);
      expect(result.map((q) => q.id).sort()).toEqual(
        [questionReferenceId, questionConditionnelleId].sort()
      );
    });
  });

  describe('Modes withReponses et reponsesOnly', () => {
    test('withReponses sans collectiviteId : erreur de validation', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.listQuestions({
          mode: 'withReponses',
          thematiqueIds: [testData.thematiqueId],
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: expect.stringContaining('collectiviteId'),
        })
      );
    });

    test('reponsesOnly sans collectiviteId : erreur de validation', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.listQuestions({
          mode: 'reponsesOnly',
          thematiqueIds: [testData.thematiqueId],
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: expect.stringContaining('collectiviteId'),
        })
      );
    });

    test('reponsesOnly : retourne des lignes réponse pour le périmètre (questions visibles)', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listQuestions(
        {
          mode: 'reponsesOnly',
          collectiviteId: testData.collectivite.id,
          thematiqueIds: [testData.thematiqueId],
          withEmptyReponse: true,
        }
      );

      expect(result.length).toBeGreaterThanOrEqual(
        testData.fixtureQuestionIds.length
      );
      expect(
        result.every(
          (r) => typeof (r as { questionId: string }).questionId === 'string'
        )
      ).toBe(true);
    });

    test('withReponses : paires question / réponse', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listQuestions(
        {
          mode: 'withReponses',
          collectiviteId: testData.collectivite.id,
          thematiqueIds: [testData.thematiqueId],
          withEmptyReponse: true,
        }
      );

      expect(result.length).toBeGreaterThan(0);
      const row = result[0] as {
        question: { id: string };
        reponse: unknown;
      };
      expect(row.question).toBeDefined();
      expect('reponse' in row).toBe(true);
    });
  });
});
