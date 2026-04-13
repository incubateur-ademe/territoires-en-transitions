import { CollectivitePreferencesService } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.service';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { referentielIdEnumValues } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import {
  addTestPersonnalisationData,
  addTestQuestionBanaticCompetencePourCollectivite,
  addTestQuestionsExprVisible,
  TestPersonnalisationData,
} from '../personnalisations.test-fixture';
import { ListThematiquesOutput } from './list-personnalisation-thematiques.output';

describe('Lister les thématiques de personnalisation', () => {
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
  });

  beforeEach(async () => {
    testData = await addTestPersonnalisationData(databaseService);
  });

  afterEach(async () => {
    if (testData) await testData.cleanup();
  });

  const getFixtureThematique = (result: ListThematiquesOutput) =>
    result.thematiques.find((t) => t.id === testData.thematiqueId);

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
      expect(thematique?.questionsCount).toBe(
        testData.fixtureQuestionIds.length
      );
      expect(thematique?.reponsesCount).toBe(0);
      expect(thematique?.referentiels).toContain('te');
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
      expect(thematique?.questionsCount).toBe(
        testData.fixtureQuestionIds.length
      );
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
      expect(thematique?.questionsCount).toBe(
        testData.fixtureQuestionIds.length
      );
      // choix avec reponse null : non compté comme réponse fournie
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

    test('referentiels contient te pour la thématique liée aux actions', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique?.referentiels).toContain('te');
    });

    test('Filtre actionIds : ne compte que les questions liées à ces mesures', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const avecUneMesure =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          actionIds: [testData.questionActionLinks[0].actionId],
        });
      expect(getFixtureThematique(avecUneMesure)?.questionsCount).toBe(1);

      const avecDeuxMesures =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          actionIds: [
            testData.questionActionLinks[0].actionId,
            testData.questionActionLinks[1].actionId,
          ],
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
          actionIds: [testData.questionActionLinks[0].actionId],
        });
      const thematique1 = getFixtureThematique(filtreAction1);
      expect(thematique1?.questionsCount).toBe(1);
      expect(thematique1?.reponsesCount).toBe(1);
      expect(thematique1?.isComplete).toBe(true);

      const filtreDeuxMesures =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          actionIds: [
            testData.questionActionLinks[0].actionId,
            testData.questionActionLinks[2].actionId,
          ],
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

    test('Filtre referentielIds : ne retient que les questions liées aux mesures de ces référentiels', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const avecTeTest =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          referentielIds: ['te'],
        });
      const thematiqueTeTest = getFixtureThematique(avecTeTest);
      expect(thematiqueTeTest).toBeDefined();
      expect(thematiqueTeTest?.referentiels).toContain('te');
      expect(thematiqueTeTest?.questionsCount).toBe(3);
      expect(thematiqueTeTest?.reponsesCount).toBe(0);

      const avecCaeSeulement =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
          referentielIds: ['cae'],
        });
      // aucune question de la fixture n'est liée à une mesure cae → la thématique de test n'apparaît pas
      expect(getFixtureThematique(avecCaeSeulement)).toBeUndefined();
    });

    test('Un utilisateur avec droits de lecture peut lister les thématiques', async () => {
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: testData.collectivite.id,
        role: CollectiviteRole.LECTURE,
      });

      try {
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
      } finally {
        await cleanup();
      }
    });
  });

  describe('Compteurs et exprVisible', () => {
    test('compte une réponse induite par competenceExercee et incrémente nbSuggestionsBanatic', async () => {
      const { cleanup } =
        await addTestQuestionBanaticCompetencePourCollectivite(
          databaseService,
          {
            collectiviteId: testData.collectivite.id,
            thematiqueId: testData.thematiqueId,
            collectiviteType: testData.collectivite.type,
          }
        );
      onTestFinished(cleanup);

      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique).toBeDefined();
      expect(thematique?.questionsCount).toBe(
        testData.fixtureQuestionIds.length + 1
      );
      expect(thematique?.reponsesCount).toBe(1);
      expect(result.nbSuggestionsBanatic).toBe(1);
    });

    test('question conditionnelle masquée sans réponse : exclue des compteurs', async () => {
      const { questionReferenceId, cleanup } =
        await addTestQuestionsExprVisible(databaseService, {
          thematiqueId: testData.thematiqueId,
          collectiviteType: testData.collectivite.type,
        });
      onTestFinished(cleanup);

      const caller = router.createCaller({ user: testData.userCredentials });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique).toBeDefined();
      // 3 questions fixture + référence expr_visible ; la conditionnelle est masquée
      expect(thematique?.questionsCount).toBe(
        testData.fixtureQuestionIds.length + 1
      );
      expect(thematique?.reponsesCount).toBe(0);
      expect(thematique?.isComplete).toBe(false);

      const questions =
        await caller.collectivites.personnalisations.listQuestions({
          mode: 'questions',
          collectiviteId: testData.collectivite.id,
          questionIds: [questionReferenceId],
        });
      expect(questions).toHaveLength(1);
    });

    test('question conditionnelle masquée avec réponse orpheline en base : ne compte pas la réponse', async () => {
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
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: questionConditionnelleId,
        reponse: true,
      });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: questionReferenceId,
        reponse: true,
      });

      const result =
        await caller.collectivites.personnalisations.listThematiques({
          collectiviteId: testData.collectivite.id,
        });

      const thematique = getFixtureThematique(result);
      expect(thematique).toBeDefined();
      expect(thematique?.questionsCount).toBe(
        testData.fixtureQuestionIds.length + 1
      );
      // seule la référence reste visible avec une réponse ; la conditionnelle est masquée malgré une ligne en base
      expect(thematique?.reponsesCount).toBe(1);
      expect(thematique?.isComplete).toBe(false);
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
