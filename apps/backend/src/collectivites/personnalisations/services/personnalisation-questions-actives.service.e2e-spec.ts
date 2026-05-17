import { INestApplication } from '@nestjs/common';
import {
  addTestPersonnalisationData,
  addTestQuestionCollectiviteNonConcernee,
  addTestQuestionsExprVisible,
  TestPersonnalisationData,
} from '@tet/backend/collectivites/personnalisations/personnalisations.test-fixture';
import { PersonnalisationQuestionsActivesService } from '@tet/backend/collectivites/personnalisations/services/personnalisation-questions-actives.service';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { onTestFinished } from 'vitest';

describe('PersonnalisationQuestionsActivesService', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let questionsActivesService: PersonnalisationQuestionsActivesService;
  let testData: TestPersonnalisationData;

  const enabledReferentiels = [ReferentielIdEnum.TE];

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    questionsActivesService = app.get(PersonnalisationQuestionsActivesService);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    testData = await addTestPersonnalisationData(databaseService);
    onTestFinished(testData.cleanup);
  });

  test('exclut une question dont le type de collectivité concerné ne correspond pas', async () => {
    const { questionId, cleanup } =
      await addTestQuestionCollectiviteNonConcernee(databaseService, {
        thematiqueId: testData.thematiqueId,
        collectiviteType: testData.collectivite.type,
      });
    onTestFinished(cleanup);

    const { questions } = await questionsActivesService.resolveActiveQuestions(
      {
        enabledReferentiels,
        filters: {
          collectiviteId: testData.collectivite.id,
          questionIds: [questionId],
        },
        reponses: {},
        collectiviteId: testData.collectivite.id,
      }
    );

    expect(questions.map((q) => q.id)).not.toContain(questionId);
  });

  describe('exprVisible', () => {
    test('exclut la question conditionnelle sans réponse NON sur la question de référence', async () => {
      const { questionReferenceId, questionConditionnelleId, cleanup } =
        await addTestQuestionsExprVisible(databaseService, {
          thematiqueId: testData.thematiqueId,
          collectiviteType: testData.collectivite.type,
        });
      onTestFinished(cleanup);

      const questionIds = [questionReferenceId, questionConditionnelleId];
      const reponses = {
        [questionReferenceId]: true,
        [questionConditionnelleId]: true,
      };

      const { questions, reponsesQuestionsActives } =
        await questionsActivesService.resolveActiveQuestions({
          enabledReferentiels,
          filters: {
            collectiviteId: testData.collectivite.id,
            questionIds,
          },
          reponses,
          collectiviteId: testData.collectivite.id,
        });

      expect(questions.map((q) => q.id)).toEqual([questionReferenceId]);
      expect(reponsesQuestionsActives).toEqual({
        [questionReferenceId]: true,
      });
    });

    test('inclut la question conditionnelle lorsque la référence est NON', async () => {
      const { questionReferenceId, questionConditionnelleId, cleanup } =
        await addTestQuestionsExprVisible(databaseService, {
          thematiqueId: testData.thematiqueId,
          collectiviteType: testData.collectivite.type,
        });
      onTestFinished(cleanup);

      const questionIds = [questionReferenceId, questionConditionnelleId];
      const reponses = {
        [questionReferenceId]: false,
        [questionConditionnelleId]: true,
      };

      const { questions, reponsesQuestionsActives } =
        await questionsActivesService.resolveActiveQuestions({
          enabledReferentiels,
          filters: {
            collectiviteId: testData.collectivite.id,
            questionIds,
          },
          reponses,
          collectiviteId: testData.collectivite.id,
        });

      expect(questions.map((q) => q.id).sort()).toEqual(questionIds.sort());
      expect(reponsesQuestionsActives).toEqual(reponses);
    });
  });
});
