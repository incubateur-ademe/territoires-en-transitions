import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { justificationTable } from '../models/justification.table';
import { reponseBinaireTable } from '../models/reponse-binaire.table';
import {
  addTestPersonnalisationData,
  listHistoriqueJustification,
  listHistoriqueReponseBinaire,
  listHistoriqueReponseChoix,
  listHistoriqueReponseProportion,
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

    test("Crée l'historique des réponses (binaire/choix/proportion) et de la justification", async () => {
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
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionProportionId,
        reponse: 0.42,
      });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
        justification: 'justification initiale',
      });

      const historiqueBinaire = await listHistoriqueReponseBinaire(
        databaseService,
        testData.collectivite.id,
        testData.questionBinaireId
      );
      expect(historiqueBinaire).toHaveLength(1);
      expect(historiqueBinaire[0]).toMatchObject({
        reponse: true,
        previousReponse: null,
        modifiedBy: testData.userCredentials.id,
      });

      const historiqueChoix = await listHistoriqueReponseChoix(
        databaseService,
        testData.collectivite.id,
        testData.questionChoixId
      );
      expect(historiqueChoix).toHaveLength(1);

      const historiqueProportion = await listHistoriqueReponseProportion(
        databaseService,
        testData.collectivite.id,
        testData.questionProportionId
      );
      expect(historiqueProportion).toHaveLength(1);

      const historiqueJustification = await listHistoriqueJustification(
        databaseService,
        testData.collectivite.id,
        testData.questionBinaireId
      );
      expect(historiqueJustification).toHaveLength(1);
      expect(historiqueJustification[0]).toMatchObject({
        texte: 'justification initiale',
        previousTexte: null,
        modifiedBy: testData.userCredentials.id,
      });
    });

    test("Déduplique l'historique des réponses pour un même utilisateur", async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
      });
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: false,
      });

      const historiqueBinaireDedup = await listHistoriqueReponseBinaire(
        databaseService,
        testData.collectivite.id,
        testData.questionBinaireId
      );
      expect(historiqueBinaireDedup).toHaveLength(1);
      expect(historiqueBinaireDedup[0].reponse).toBe(false);
    });

    test("Insère une nouvelle ligne d'historique quand l'utilisateur change", async () => {
      const caller = router.createCaller({ user: testData.userCredentials });
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: testData.collectivite.id,
        role: CollectiviteRole.ADMIN,
      });

      try {
        const adminUser = getAuthUserFromUserCredentials(user);
        const adminCaller = router.createCaller({ user: adminUser });

        await caller.collectivites.personnalisations.setReponse({
          collectiviteId: testData.collectivite.id,
          questionId: testData.questionBinaireId,
          reponse: true,
          justification: 'justification éditeur',
        });
        await adminCaller.collectivites.personnalisations.setReponse({
          collectiviteId: testData.collectivite.id,
          questionId: testData.questionBinaireId,
          reponse: false,
          justification: 'justification admin',
        });

        const historiqueBinaire = await listHistoriqueReponseBinaire(
          databaseService,
          testData.collectivite.id,
          testData.questionBinaireId
        );
        expect(historiqueBinaire).toHaveLength(2);
        const adminBinaireRow = historiqueBinaire.find(
          (row) => row.modifiedBy === adminUser.id
        );
        expect(adminBinaireRow?.previousReponse).toBe(true);

        const historiqueJustification = await listHistoriqueJustification(
          databaseService,
          testData.collectivite.id,
          testData.questionBinaireId
        );
        expect(historiqueJustification).toHaveLength(2);
        const adminJustificationRow = historiqueJustification.find(
          (row) => row.modifiedBy === adminUser.id
        );
        expect(adminJustificationRow).toMatchObject({
          texte: 'justification admin',
          previousTexte: 'justification éditeur',
          previousModifiedBy: testData.userCredentials.id,
        });
      } finally {
        await databaseService.db
          .delete(justificationTable)
          .where(
            and(
              eq(justificationTable.collectiviteId, testData.collectivite.id),
              eq(justificationTable.questionId, testData.questionBinaireId)
            )
          );
        await cleanup();
      }
    });

    test('Met à jour modified_at lors de la mise à jour de réponse', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: true,
      });

      const firstRow = await databaseService.db
        .select()
        .from(reponseBinaireTable)
        .where(
          and(
            eq(reponseBinaireTable.collectiviteId, testData.collectivite.id),
            eq(reponseBinaireTable.questionId, testData.questionBinaireId)
          )
        )
        .then((rows) => rows[0]);
      const firstModifiedAt = firstRow?.modifiedAt;

      await new Promise((resolve) => setTimeout(resolve, 1100));

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: testData.collectivite.id,
        questionId: testData.questionBinaireId,
        reponse: false,
      });

      const secondRow = await databaseService.db
        .select()
        .from(reponseBinaireTable)
        .where(
          and(
            eq(reponseBinaireTable.collectiviteId, testData.collectivite.id),
            eq(reponseBinaireTable.questionId, testData.questionBinaireId)
          )
        )
        .then((rows) => rows[0]);

      expect(firstModifiedAt).toBeDefined();
      expect(secondRow?.modifiedAt).toBeDefined();
      if (firstModifiedAt !== undefined && secondRow?.modifiedAt !== undefined) {
        expect(new Date(secondRow.modifiedAt).getTime()).toBeGreaterThan(
          new Date(firstModifiedAt).getTime()
        );
      }

      const justificationRow = await databaseService.db
        .select()
        .from(justificationTable)
        .where(
          and(
            eq(justificationTable.collectiviteId, testData.collectivite.id),
            eq(justificationTable.questionId, testData.questionBinaireId)
          )
        )
        .then((rows) => rows[0]);

      expect(justificationRow).toBeUndefined();
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
