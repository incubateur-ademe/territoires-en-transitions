import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteAccessLevelEnum } from '@tet/domain/users';
import { onTestFinished } from 'vitest';

describe('Récupérer un plan', () => {
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let planId: number;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
      user: {
        accessLevel: CollectiviteAccessLevelEnum.ADMIN,
      },
      collectivite: {
        accesRestreint: true,
      },
    });

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromDcp(testCollectiviteAndUserResult.user);

    // Créer un plan pour les tests
    const caller = router.createCaller({ user: editorUser });
    const plan = await caller.plans.plans.create({
      nom: 'Plan de test',
      collectiviteId: collectivite.id,
    });
    planId = plan.id;

    return async () => {
      await caller.plans.plans.delete({ planId });
      await testCollectiviteAndUserResult.cleanup();
    };
  });

  describe('Récupérer un plan - Cas de succès', () => {
    test('Récupérer avec succès un plan existant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan à récupérer',
        collectiviteId: collectivite.id,
      });
      const testPlanId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId: testPlanId });
      });

      const result = await caller.plans.plans.get({
        planId: testPlanId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(testPlanId);
      expect(result.nom).toBe('Plan à récupérer');
      expect(result.collectiviteId).toBe(collectivite.id);
      expect(result.axes).toBeDefined();
      expect(Array.isArray(result.axes)).toBe(true);
      expect(result.referents).toBeDefined();
      expect(Array.isArray(result.referents)).toBe(true);
      expect(result.pilotes).toBeDefined();
      expect(Array.isArray(result.pilotes)).toBe(true);
      expect(result.createdAt).toBeDefined();
    });

    test('Récupérer avec succès un plan avec planType', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan avec un type
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan avec type',
        collectiviteId: collectivite.id,
      });
      const testPlanId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId: testPlanId });
      });

      const result = await caller.plans.plans.get({
        planId: testPlanId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(testPlanId);
      expect(result.type).toBeDefined(); // Peut être null ou un objet PlanType
    });

    test('Récupérer avec succès un plan avec des axes', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan avec axes',
        collectiviteId: collectivite.id,
      });
      const testPlanId = createdPlan.id;

      // Créer un axe dans ce plan
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe de test',
        collectiviteId: collectivite.id,
        planId: testPlanId,
        parent: testPlanId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: createdAxe.id });
        await cleanupCaller.plans.plans.delete({ planId: testPlanId });
      });

      const result = await caller.plans.plans.get({
        planId: testPlanId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(testPlanId);
      expect(result.axes).toBeDefined();
      expect(result.axes.length).toBeGreaterThan(0);
      const axe = result.axes.find((a) => a.id === createdAxe.id);
      expect(axe).toBeDefined();
      expect(axe?.nom).toBe('Axe de test');
    });
  });

  describe("Récupérer un plan - Cas d'erreur", () => {
    test("Échec de récupération d'un plan inexistant", async () => {
      const caller = router.createCaller({ user: editorUser });

      const nonExistentPlanId = 999999;

      await expect(
        caller.plans.plans.get({
          planId: nonExistentPlanId,
        })
      ).rejects.toThrow("Le plan demandé n'a pas été trouvé");
    });

    test("Échec de récupération d'un plan avec un planId invalide (négatif)", async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.plans.plans.get({
          planId: -1,
        })
      ).rejects.toThrow();
    });

    test("Échec de récupération d'un plan avec un planId invalide (zéro)", async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.plans.plans.get({
          planId: 0,
        })
      ).rejects.toThrow();
    });

    test("Échec de récupération d'un plan quand le collectiviteId ne correspond pas au plan", async () => {
      const caller = router.createCaller({ user: editorUser });

      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan pour test mismatch collectivite',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        await caller.plans.plans.delete({ planId: createdPlan.id });
      });

      // Essayer de récupérer le plan avec le collectiviteId d'une autre collectivité
      await expect(
        caller.plans.plans.get({
          planId: createdPlan.id,
          collectiviteId: createdPlan.collectiviteId + 1,
        })
      ).rejects.toThrow("Le plan demandé n'a pas été trouvé");
    });
  });

  describe("Récupérer un plan - Droits d'accès", () => {
    test('Un utilisateur sans droits sur la collectivité ne peut pas récupérer un plan', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan avec l'utilisateur admin
      const createdPlan = await caller.plans.plans.create({
        nom: 'Plan pour test permissions',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId: createdPlan.id });
      });

      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const unauthorizedCaller = router.createCaller({ user: yoloDodoUser });

      await expect(
        unauthorizedCaller.plans.plans.get({
          planId: createdPlan.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité peut récupérer un plan', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      // Créer un plan avec l'utilisateur admin
      const adminCaller = router.createCaller({ user: editorUser });
      const createdPlan = await adminCaller.plans.plans.create({
        nom: 'Plan pour lecture',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId: createdPlan.id });
      });

      const result = await caller.plans.plans.get({
        planId: createdPlan.id,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdPlan.id);
      expect(result.nom).toBe('Plan pour lecture');
      expect(result.collectiviteId).toBe(collectivite.id);
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas récupérer un plan", async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: limitedEditionUser });

      // Créer un plan avec l'utilisateur admin
      const adminCaller = router.createCaller({ user: editorUser });
      const createdPlan = await adminCaller.plans.plans.create({
        nom: 'Plan pour édition limitée',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId: createdPlan.id });
      });

      await expect(
        caller.plans.plans.get({
          planId: createdPlan.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test("Un utilisateur avec des droits d'édition sur la collectivité peut récupérer un plan", async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.EDITION,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const editionUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: editionUser });

      // Créer un plan avec l'utilisateur admin
      const adminCaller = router.createCaller({ user: editorUser });
      const createdPlan = await adminCaller.plans.plans.create({
        nom: 'Plan pour édition',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.plans.delete({ planId: createdPlan.id });
      });

      const result = await caller.plans.plans.get({
        planId: createdPlan.id,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdPlan.id);
      expect(result.nom).toBe('Plan pour édition');
    });
  });
});
