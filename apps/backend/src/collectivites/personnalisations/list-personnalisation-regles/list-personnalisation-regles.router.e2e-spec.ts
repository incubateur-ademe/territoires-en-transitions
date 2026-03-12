import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PersonnalisationRegle } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import {
  addTestPersonnalisationData,
  TestPersonnalisationData,
} from '../personnalisations.test-fixture';

describe('Lister les règles de personnalisation', () => {
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let testData: TestPersonnalisationData;

  beforeAll(async () => {
    const app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);
    testData = await addTestPersonnalisationData(databaseService);
  });

  afterAll(async () => {
    if (testData) await testData.cleanup();
  });

  describe('List Regles - Cas de succès', () => {
    test('Retourne des règles sans filtre actionIds', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listRegles(
        {}
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0); // dépend des données seed
      const regle = result[0] as PersonnalisationRegle;
      expect(regle).toMatchObject({
        actionId: expect.any(String),
        type: expect.stringMatching(/^(score|desactivation|reduction)$/),
        formule: expect.any(String),
        description: expect.any(String),
        modifiedAt: expect.any(String),
      });
    });

    test('Filtre par actionIds retourne uniquement les règles des actions demandées', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      // Récupère d'abord toutes les règles pour avoir des actionIds valides (données seed)
      const allRegles =
        await caller.collectivites.personnalisations.listRegles();
      const actionIds = [...new Set(allRegles.map((r) => r.actionId))].slice(
        0,
        2
      );
      expect(actionIds.length).toBeGreaterThan(0);

      const result = await caller.collectivites.personnalisations.listRegles({
        actionIds,
      });

      expect(result.every((r) => actionIds.includes(r.actionId))).toBe(true);
      expect(result.length).toBeLessThanOrEqual(allRegles.length);
    });

    test('Filtre par actionIds inexistants retourne un tableau vide', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      const result = await caller.collectivites.personnalisations.listRegles({
        actionIds: ['action-inexistante-123', 'autre-action-fantome'],
      });

      expect(result).toHaveLength(0);
    });

    test('Un utilisateur avec droits de lecture peut récupérer les règles', async () => {
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
        await readOnlyCaller.collectivites.personnalisations.listRegles();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("List Regles - Cas d'erreur", () => {
    test('Il faut être authentifié', async () => {
      const caller = router.createCaller({ user: null });

      await expect(
        caller.collectivites.personnalisations.listRegles()
      ).rejects.toThrow();
    });

    test('Un actionId vide dans le tableau retourne une erreur de validation', async () => {
      const caller = router.createCaller({ user: testData.userCredentials });

      await expect(
        caller.collectivites.personnalisations.listRegles({
          actionIds: ['cae_1.1.2.0.1', ''],
        })
      ).rejects.toThrow();
    });
  });
});
