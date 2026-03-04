import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUser,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { questionChoixTable } from '../models/question-choix.table';
import { questionThematiqueTable } from '../models/question-thematique.table';
import { questionTable } from '../models/question.table';
import { reponseBinaireTable } from '../models/reponse-binaire.table';
import { reponseChoixTable } from '../models/reponse-choix.table';
import { reponseProportionTable } from '../models/reponse-proportion.table';

describe('Enregistrer une réponse à une question de personnalisation', () => {
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;

  // Questions de test
  let questionBinaireId: string;
  let questionProportionId: string;
  let questionChoixId: string;
  let choixId: string;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          accessLevel: CollectiviteRole.ADMIN,
        },
      }
    );

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUserResult.user
    );

    // Créer une thématique de test
    const thematiqueId = 'test-thematique';
    await databaseService.db.insert(questionThematiqueTable).values({
      id: thematiqueId,
      nom: 'Thématique de test',
    });

    // Créer des questions de test pour chaque type
    questionBinaireId = 'test-question-binaire';
    questionProportionId = 'test-question-proportion';
    questionChoixId = 'test-question-choix';

    await databaseService.db.insert(questionTable).values([
      {
        id: questionBinaireId,
        type: 'binaire',
        description: 'Question binaire de test',
        formulation: 'Est-ce une question binaire ?',
        thematiqueId,
        version: '1.0.0',
      },
      {
        id: questionProportionId,
        type: 'proportion',
        description: 'Question proportion de test',
        formulation: 'Quelle est la proportion ?',
        thematiqueId,
        version: '1.0.0',
      },
      {
        id: questionChoixId,
        type: 'choix',
        description: 'Question choix de test',
        formulation: 'Quel est votre choix ?',
        thematiqueId,
        version: '1.0.0',
      },
    ]);

    // Créer un choix pour la question de type choix
    choixId = 'test-choix-1';
    await databaseService.db.insert(questionChoixTable).values({
      id: choixId,
      questionId: questionChoixId,
      formulation: 'Choix 1',
      ordonnancement: 1,
      version: '1.0.0',
    });

    return async () => {
      // Nettoyer les réponses
      await databaseService.db
        .delete(reponseBinaireTable)
        .where(eq(reponseBinaireTable.collectiviteId, collectivite.id));
      await databaseService.db
        .delete(reponseProportionTable)
        .where(eq(reponseProportionTable.collectiviteId, collectivite.id));
      await databaseService.db
        .delete(reponseChoixTable)
        .where(eq(reponseChoixTable.collectiviteId, collectivite.id));

      // Nettoyer les questions
      await databaseService.db
        .delete(questionChoixTable)
        .where(eq(questionChoixTable.questionId, questionChoixId));
      await databaseService.db
        .delete(questionTable)
        .where(eq(questionTable.id, questionBinaireId));
      await databaseService.db
        .delete(questionTable)
        .where(eq(questionTable.id, questionProportionId));
      await databaseService.db
        .delete(questionTable)
        .where(eq(questionTable.id, questionChoixId));
      await databaseService.db
        .delete(questionThematiqueTable)
        .where(eq(questionThematiqueTable.id, thematiqueId));

      await testCollectiviteAndUserResult.cleanup();
    };
  });

  describe('Set Personnalisation Reponse - Cas de succès', () => {
    test('Créer avec succès une réponse binaire', async () => {
      const caller = router.createCaller({ user: editorUser });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: collectivite.id,
        questionId: questionBinaireId,
        reponse: true,
      });

      // Vérifier que la réponse a été créée
      const [reponse] = await databaseService.db
        .select()
        .from(reponseBinaireTable)
        .where(eq(reponseBinaireTable.questionId, questionBinaireId))
        .limit(1);

      expect(reponse).toBeDefined();
      expect(reponse.reponse).toBe(true);
      expect(reponse.collectiviteId).toBe(collectivite.id);
      expect(reponse.questionId).toBe(questionBinaireId);

      onTestFinished(async () => {
        await databaseService.db
          .delete(reponseBinaireTable)
          .where(eq(reponseBinaireTable.questionId, questionBinaireId));
      });
    });

    test('Mettre à jour avec succès une réponse binaire', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer une réponse initiale
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: collectivite.id,
        questionId: questionBinaireId,
        reponse: true,
      });

      // Mettre à jour la réponse
      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: collectivite.id,
        questionId: questionBinaireId,
        reponse: false,
      });

      // Vérifier que la réponse a été mise à jour
      const [reponse] = await databaseService.db
        .select()
        .from(reponseBinaireTable)
        .where(eq(reponseBinaireTable.questionId, questionBinaireId))
        .limit(1);

      expect(reponse.reponse).toBe(false);

      onTestFinished(async () => {
        await databaseService.db
          .delete(reponseBinaireTable)
          .where(eq(reponseBinaireTable.questionId, questionBinaireId));
      });
    });

    test('Créer avec succès une réponse proportion', async () => {
      const caller = router.createCaller({ user: editorUser });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: collectivite.id,
        questionId: questionProportionId,
        reponse: 0.75,
      });

      // Vérifier que la réponse a été créée
      const [reponse] = await databaseService.db
        .select()
        .from(reponseProportionTable)
        .where(eq(reponseProportionTable.questionId, questionProportionId))
        .limit(1);

      expect(reponse).toBeDefined();
      expect(reponse.reponse).toBe(0.75);
      expect(reponse.collectiviteId).toBe(collectivite.id);
      expect(reponse.questionId).toBe(questionProportionId);

      onTestFinished(async () => {
        await databaseService.db
          .delete(reponseProportionTable)
          .where(eq(reponseProportionTable.questionId, questionProportionId));
      });
    });

    test('Créer avec succès une réponse choix', async () => {
      const caller = router.createCaller({ user: editorUser });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: collectivite.id,
        questionId: questionChoixId,
        reponse: choixId,
      });

      // Vérifier que la réponse a été créée
      const [reponse] = await databaseService.db
        .select()
        .from(reponseChoixTable)
        .where(eq(reponseChoixTable.questionId, questionChoixId))
        .limit(1);

      expect(reponse).toBeDefined();
      expect(reponse.reponse).toBe(choixId);
      expect(reponse.collectiviteId).toBe(collectivite.id);
      expect(reponse.questionId).toBe(questionChoixId);

      onTestFinished(async () => {
        await databaseService.db
          .delete(reponseChoixTable)
          .where(eq(reponseChoixTable.questionId, questionChoixId));
      });
    });

    test('Créer avec succès une réponse null', async () => {
      const caller = router.createCaller({ user: editorUser });

      await caller.collectivites.personnalisations.setReponse({
        collectiviteId: collectivite.id,
        questionId: questionBinaireId,
        reponse: null,
      });

      // Vérifier que la réponse a été créée avec null
      const [reponse] = await databaseService.db
        .select()
        .from(reponseBinaireTable)
        .where(eq(reponseBinaireTable.questionId, questionBinaireId))
        .limit(1);

      expect(reponse).toBeDefined();
      expect(reponse.reponse).toBeNull();

      onTestFinished(async () => {
        await databaseService.db
          .delete(reponseBinaireTable)
          .where(eq(reponseBinaireTable.questionId, questionBinaireId));
      });
    });
  });

  describe("Set Personnalisation Reponse - Cas d'erreur", () => {
    test('Un utilisateur sans droits sur la collectivité ne peut pas créer une réponse', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: collectivite.id,
          questionId: questionBinaireId,
          reponse: true,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité ne peut pas créer une réponse', async () => {
      const { user, cleanup } = await addTestUser(databaseService, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteRole.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromUserCredentials(user);
      const caller = router.createCaller({ user: lectureUser });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: collectivite.id,
          questionId: questionBinaireId,
          reponse: true,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Une question inexistante retourne une erreur', async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: collectivite.id,
          questionId: 'question-inexistante',
          reponse: true,
        })
      ).rejects.toThrow("La question demandée n'existe pas");
    });

    test('Un collectiviteId invalide retourne une erreur de validation', async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: -1,
          questionId: questionBinaireId,
          reponse: true,
        })
      ).rejects.toThrow();
    });

    test('Un questionId vide retourne une erreur de validation', async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: collectivite.id,
          questionId: '',
          reponse: true,
        })
      ).rejects.toThrow();
    });

    test('Créer une réponse binaire avec le mauvais type de données génère une erreur', async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: collectivite.id,
          questionId: questionBinaireId,
          reponse: 'oui', // chaîne au lieu de booléen
        })
      ).rejects.toThrow('Réponse non valide pour cette question');
    });

    test('Créer une réponse proportion avec le mauvais type de données génère une erreur', async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: collectivite.id,
          questionId: questionProportionId,
          reponse: '0.75', // chaîne au lieu de number
        })
      ).rejects.toThrow('Réponse non valide pour cette question');
    });

    test('Créer une réponse choix avec le mauvais type de données génère une erreur', async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.collectivites.personnalisations.setReponse({
          collectiviteId: collectivite.id,
          questionId: questionChoixId,
          reponse: false, // booléen au lieu de string
        })
      ).rejects.toThrow('Réponse non valide pour cette question');
    });
  });
});
