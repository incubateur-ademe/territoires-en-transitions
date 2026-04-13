import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import {
  addTestPersonnalisationData,
  TestPersonnalisationData,
} from '../personnalisations.test-fixture';

describe('Enregistrer une réponse à une question de personnalisation', () => {
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  let testData: TestPersonnalisationData;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);
  });

  beforeEach(async () => {
    testData = await addTestPersonnalisationData(databaseService);
  });

  afterEach(async () => {
    if (testData) {
      await testData.cleanup();
    }
  });

  describe('Set Personnalisation Reponse - Cas de succès', () => {
    test('Créer avec succès une réponse binaire', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
      });

      expect(result).toBeDefined();
      expect(result.reponse).toBe(true);
      expect(result.justification).toBe(null);
      expect(result.questionId).toBe(testData.questionBinaireId);
    });

    test('Mettre à jour avec succès une réponse binaire', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      // Créer une réponse initiale
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
      });

      // Mettre à jour la réponse
      const result = await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: false,
      });

      expect(result.reponse).toBe(false);
    });

    test('Créer avec succès une réponse avec une justification', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
        justification: 'Ma justification',
      });

      expect(result).toBeDefined();
      expect(result.reponse).toBe(true);
      expect(result.questionId).toBe(testData.questionBinaireId);
      expect(result.justification).toBe('Ma justification');
    });

    test('Créer avec succès une réponse proportion', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionProportionId,
        reponse: 0.75,
      });

      expect(result).toBeDefined();
      expect(result.reponse).toBe(0.75);
      expect(result.questionId).toBe(testData.questionProportionId);
    });

    test('Créer avec succès une réponse choix', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionChoixId,
        reponse: testData.choixId,
      });

      expect(result).toBeDefined();
      expect(result.reponse).toBe(testData.choixId);
      expect(result.questionId).toBe(testData.questionChoixId);
    });

    test('Créer avec succès une réponse null', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: null,
      });

      expect(result).toBeDefined();
      expect(result.reponse).toBeNull();
    });
  });

  describe("Set Personnalisation Reponse - Cas d'erreur", () => {
    test('Un utilisateur sans droits sur la collectivité ne peut pas créer une réponse', async () => {
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: null,
      });

      try {
        const userSansCollectivite = getAuthUserFromUserCredentials(user);
        const caller = router.createCaller({ user: userSansCollectivite });

        await expect(
          caller.collectivites.personnalisations.setReponse({
            collectiviteId: testData.collectivite.id,
            questionId: testData.questionBinaireId,
            reponse: true,
          })
        ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
      } finally {
        await cleanup();
      }
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité ne peut pas créer une réponse', async () => {
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: testData.collectivite.id,
        role: CollectiviteRole.LECTURE,
      });

      try {
        const lectureUser = getAuthUserFromUserCredentials(user);
        const caller = router.createCaller({ user: lectureUser });

        await expect(
          caller.collectivites.personnalisations.setReponse({
            collectiviteId: testData.collectivite.id,
            questionId: testData.questionBinaireId,
            reponse: true,
          })
        ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
      } finally {
        await cleanup();
      }
    });

    test('Une question inexistante retourne une erreur', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: testData.collectivite.id,
          questionId: 'question-inexistante',
          reponse: true,
        })
      ).rejects.toThrow("La question demandée n'existe pas");
    });

    test('Un collectiviteId invalide retourne une erreur de validation', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: -1,
          questionId: testData.questionBinaireId,
          reponse: true,
        })
      ).rejects.toThrow();
    });

    test('Un questionId vide retourne une erreur de validation', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: testData.collectivite.id,
          questionId: '',
          reponse: true,
        })
      ).rejects.toThrow();
    });

    test('Créer une réponse binaire avec le mauvais type de données génère une erreur', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: testData.collectivite.id,
          questionId: testData.questionBinaireId,
          reponse: 'oui', // chaîne au lieu de booléen
        })
      ).rejects.toThrow('Réponse non valide pour cette question');
    });

    test('Créer une réponse proportion avec le mauvais type de données génère une erreur', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: testData.collectivite.id,
          questionId: testData.questionProportionId,
          reponse: '0.75', // chaîne au lieu de number
        })
      ).rejects.toThrow('Réponse non valide pour cette question');
    });

    test('Créer une réponse choix avec le mauvais type de données génère une erreur', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: testData.collectivite.id,
          questionId: testData.questionChoixId,
          reponse: false, // booléen au lieu de string
        })
      ).rejects.toThrow('Réponse non valide pour cette question');
    });
  });
});
