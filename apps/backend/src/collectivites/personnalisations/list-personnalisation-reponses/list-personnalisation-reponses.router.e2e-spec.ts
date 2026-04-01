import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PersonnalisationReponse } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import {
  addTestPersonnalisationData,
  TestPersonnalisationData,
} from '../personnalisations.test-fixture';

describe('Lister les réponses aux questions de personnalisation', () => {
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

  describe('List Personnalisation Reponses - Cas de succès', () => {
    test('Ne retourne pas de résultat pour les questions sans réponse enregistrée', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listReponses({
        collectiviteId: testData.collectivite.id,
        questionIds: [
          testData.questionBinaireId,
          testData.questionProportionId,
          testData.questionChoixId,
        ],
      });

      expect(result).toHaveLength(0);
    });

    test('Retourne aussi les réponses vides (null) pour les questions sans réponse enregistrée si `withEmptyReponse` est spécifié', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listReponses({
        withEmptyReponse: true,
        collectiviteId: testData.collectivite.id,
        questionIds: [
          testData.questionBinaireId,
          testData.questionProportionId,
          testData.questionChoixId,
        ],
      });

      expect(result).toHaveLength(3);
      expect(result.filter((r) => r.reponse === null)).toHaveLength(3);
    });

    test('Retourne la réponse Banatic (compétence exercée) si elle existe à défaut de la réponse de la collectivité', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listReponses({
        collectiviteId: testData.collectivite.id,
        questionIds: [testData.questionBinaireCompetenceBanaticId],
      });

      expect(result).toHaveLength(1);
      const row = result[0];
      expect(row.questionType).toBe('binaire');
      expect(row.questionId).toBe(testData.questionBinaireCompetenceBanaticId);
      expect(row.reponse).toBe(true);
      expect(row.competenceCode).toBe(testData.competenceBanaticTestCode);
      expect(row.competenceIntitule).toEqual(testData.competenceIntitule);
      expect(row.competenceExercee).toBe(true);
      expect(row.natureTransfert).toBe('transfert de test');
    });

    test('Retourne les réponses binaire, proportion et choix enregistrées', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      // Enregistrer les réponses via setReponse
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

      // Récupérer les réponses
      const result = await caller.collectivites.personnalisations.listReponses({
        collectiviteId: testData.collectivite.id,
        questionIds: [
          testData.questionBinaireId,
          testData.questionProportionId,
          testData.questionChoixId,
        ],
      });

      expect(result).toHaveLength(3);

      const binaireResult = result.find(
        (r: PersonnalisationReponse) =>
          r.questionId === testData.questionBinaireId
      );
      expect(binaireResult?.reponse).toEqual(true);

      const proportionResult = result.find(
        (r: PersonnalisationReponse) =>
          r.questionId === testData.questionProportionId
      );
      expect(proportionResult?.reponse).toEqual(0.5);

      const choixResult = result.find(
        (r: PersonnalisationReponse) =>
          r.questionId === testData.questionChoixId
      );
      expect(choixResult?.reponse).toEqual(testData.choixId);
    });

    test('Retourne les justifications associées aux réponses', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
        justification: 'Justification de test',
      });

      const result = await caller.collectivites.personnalisations.listReponses({
        collectiviteId: testData.collectivite.id,
        questionIds: [testData.questionBinaireId],
      });

      expect(result).toHaveLength(1);
      expect(result[0].justification).toBe('Justification de test');
    });

    test('Un utilisateur avec droits de lecture peut récupérer les réponses', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
      });

      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: testData.collectivite.id,
        role: CollectiviteRole.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromUserCredentials(user);
      const readOnlyCaller = router.createCaller({ user: lectureUser });

      const result =
        await readOnlyCaller.collectivites.personnalisations.listReponses({
          collectiviteId: testData.collectivite.id,
          questionIds: [testData.questionBinaireId],
        });

      expect(result).toHaveLength(1);
      expect(result[0].questionId).toBe(testData.questionBinaireId);
    });

    test('Un tableau questionIds vide retourne un résultat vide', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listReponses({
        collectiviteId: testData.collectivite.id,
        questionIds: [],
      });

      expect(result).toHaveLength(0);
    });

    test('Sans questionIds toutes les réponses disponibles sont renvoyées', async () => {
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

      const result = await caller.collectivites.personnalisations.listReponses({
        collectiviteId: testData.collectivite.id,
      });

      expect(result.length).toEqual(3);
      expect(
        result.find((r) => r.questionId === testData.questionBinaireId)?.reponse
      ).toBe(true);
      expect(
        result.find((r) => r.questionId === testData.questionChoixId)?.reponse
      ).toBe(testData.choixId);
      expect(
        result.find(
          (r) => r.questionId === testData.questionBinaireCompetenceBanaticId
        )?.reponse
      ).toBe(true);
    });
  });

  describe("List Personnalisation Reponses - Cas d'erreur", () => {
    test('Un collectiviteId invalide retourne une erreur de validation', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.listReponses({
          collectiviteId: -1,
          questionIds: [testData.questionBinaireId],
        })
      ).rejects.toThrow();
    });

    test('Un questionId vide dans le tableau retourne une erreur de validation', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.listReponses({
          collectiviteId: testData.collectivite.id,
          questionIds: [''],
        })
      ).rejects.toThrow();
    });
  });
});
