import { INestApplication } from '@nestjs/common';
import {
  addTestPersonnalisationData,
  addTestQuestionCollectiviteNonConcernee,
  addTestQuestionsExprVisible,
  addTestQuestionsExprVisibleCascade,
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

    const { questions } = await questionsActivesService.resolveActiveQuestions({
      enabledReferentiels,
      filters: {
        collectiviteId: testData.collectivite.id,
        questionIds: [questionId],
      },
      reponses: {},
      collectiviteId: testData.collectivite.id,
    });

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
  describe('exprVisible en cascade', () => {
    const resolve = (
      questionIds: string[],
      reponses: Record<string, boolean>,
      referentiels = enabledReferentiels
    ) =>
      questionsActivesService.resolveActiveQuestions({
        enabledReferentiels: referentiels,
        filters: {
          collectiviteId: testData.collectivite.id,
          referentielIds: referentiels,
          questionIds,
        },
        reponses,
        collectiviteId: testData.collectivite.id,
      });

    const addCascade = async () => {
      const cascade = await addTestQuestionsExprVisibleCascade(
        databaseService,
        { thematiqueId: testData.thematiqueId }
      );
      onTestFinished(cascade.cleanup);
      return cascade;
    };

    test("masque le dernier niveau quand le premier masque l'intermédiaire, malgré la réponse conservée", async () => {
      const {
        questionAId: a,
        questionBId: b,
        questionCId: c,
      } = await addCascade();

      const { questions, reponsesQuestionsActives } = await resolve([a, b, c], {
        [a]: false,
        [b]: true,
        [c]: true,
      });

      expect(questions.map((q) => q.id)).toEqual([a]);
      expect(reponsesQuestionsActives).toEqual({ [a]: false });
    });

    test('affiche toute la chaîne quand les conditions sont satisfaites', async () => {
      const {
        questionAId: a,
        questionBId: b,
        questionCId: c,
      } = await addCascade();

      const { questions } = await resolve([a, b, c], {
        [a]: true,
        [b]: true,
        [c]: false,
      });

      expect(questions.map((q) => q.id).sort()).toEqual([a, b, c].sort());
    });

    test('tient compte des questions parentes exclues par le filtre', async () => {
      const {
        questionAId: a,
        questionBId: b,
        questionCId: c,
      } = await addCascade();

      const visible = await resolve([c], { [a]: true, [b]: true });
      expect(visible.questions.map((q) => q.id)).toEqual([c]);

      const masquee = await resolve([c], { [a]: false, [b]: true });
      expect(masquee.questions).toEqual([]);
    });

    test("garde une question dont la parente n'est liée qu'à un autre référentiel", async () => {
      const {
        questionGrandParenteAutreReferentielId: grandParente,
        questionParenteAutreReferentielId: parente,
        questionEnfantId: enfant,
      } = await addCascade();

      const { questions } = await resolve(
        [enfant],
        { [grandParente]: true, [parente]: true },
        [ReferentielIdEnum.TE]
      );

      expect(questions.map((q) => q.id)).toEqual([enfant]);
    });

    test('masque une question dont la parente, liée à un autre référentiel, est elle-même masquée', async () => {
      const {
        questionGrandParenteAutreReferentielId: grandParente,
        questionParenteAutreReferentielId: parente,
        questionEnfantId: enfant,
      } = await addCascade();

      const { questions } = await resolve(
        [enfant],
        { [grandParente]: false, [parente]: true, [enfant]: true },
        [ReferentielIdEnum.TE]
      );

      expect(questions).toEqual([]);
    });
  });
});
