import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.fixture';
import {
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteAccessLevelEnum } from '@tet/domain/users';
import { onTestFinished } from 'vitest';

describe('Lister les plans', () => {
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;

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

    return async () => {
      await testCollectiviteAndUserResult.cleanup();
    };
  });

  describe('Lister les plans - Cas de succès', () => {
    test('Lister avec succès des plans vides', async () => {
      const caller = router.createCaller({ user: editorUser });

      const result = await caller.plans.list({
        collectiviteId: collectivite.id,
      });

      expect(result).toBeDefined();
      expect(result.plans).toBeDefined();
      expect(Array.isArray(result.plans)).toBe(true);
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });

    test('Lister avec succès un plan unique', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan
      const createdPlan = await caller.plans.upsert({
        nom: 'Plan unique',
        collectiviteId: collectivite.id,
      });
      const planId = createdPlan.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.delete({ planId });
      });

      const result = await caller.plans.list({
        collectiviteId: collectivite.id,
      });

      expect(result.totalCount).toBeGreaterThanOrEqual(1);
      expect(result.plans.length).toBeGreaterThanOrEqual(1);
      const plan = result.plans.find((p) => p.id === planId);
      expect(plan).toBeDefined();
      expect(plan?.nom).toBe('Plan unique');
      expect(plan?.collectiviteId).toBe(collectivite.id);
      expect(plan?.axes).toBeDefined();
      expect(Array.isArray(plan?.axes)).toBe(true);
      expect(plan?.referents).toBeDefined();
      expect(Array.isArray(plan?.referents)).toBe(true);
      expect(plan?.pilotes).toBeDefined();
      expect(Array.isArray(plan?.pilotes)).toBe(true);
    });

    test('Lister avec succès plusieurs plans', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer plusieurs plans
      const plan1 = await caller.plans.upsert({
        nom: 'Plan 1',
        collectiviteId: collectivite.id,
      });

      const plan2 = await caller.plans.upsert({
        nom: 'Plan 2',
        collectiviteId: collectivite.id,
      });

      const plan3 = await caller.plans.upsert({
        nom: 'Plan 3',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.delete({ planId: plan1.id });
        await cleanupCaller.plans.delete({ planId: plan2.id });
        await cleanupCaller.plans.delete({ planId: plan3.id });
      });

      const result = await caller.plans.list({
        collectiviteId: collectivite.id,
      });

      expect(result.totalCount).toBeGreaterThanOrEqual(3);
      expect(result.plans.length).toBeGreaterThanOrEqual(3);
      expect(result.plans.map((p) => p.id)).toEqual(
        expect.arrayContaining([plan1.id, plan2.id, plan3.id])
      );
    });

    test('Lister avec succès les plans avec une limite', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer plusieurs plans
      const plan1 = await caller.plans.upsert({
        nom: 'Plan limit 1',
        collectiviteId: collectivite.id,
      });

      const plan2 = await caller.plans.upsert({
        nom: 'Plan limit 2',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.delete({ planId: plan1.id });
        await cleanupCaller.plans.delete({ planId: plan2.id });
      });

      const result = await caller.plans.list({
        collectiviteId: collectivite.id,
        limit: 1,
      });

      expect(result.plans).toHaveLength(1);
      expect(result.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('Lister avec succès les plans avec pagination', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer plusieurs plans
      const plan1 = await caller.plans.upsert({
        nom: 'Plan page 1',
        collectiviteId: collectivite.id,
      });

      const plan2 = await caller.plans.upsert({
        nom: 'Plan page 2',
        collectiviteId: collectivite.id,
      });

      const plan3 = await caller.plans.upsert({
        nom: 'Plan page 3',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.delete({ planId: plan1.id });
        await cleanupCaller.plans.delete({ planId: plan2.id });
        await cleanupCaller.plans.delete({ planId: plan3.id });
      });

      // Première page
      const page1 = await caller.plans.list({
        collectiviteId: collectivite.id,
        limit: 2,
        page: 1,
      });

      expect(page1.plans).toHaveLength(2);
      expect(page1.totalCount).toBeGreaterThanOrEqual(3);

      // Deuxième page
      const page2 = await caller.plans.list({
        collectiviteId: collectivite.id,
        limit: 2,
        page: 2,
      });

      expect(page2.plans.length).toBeGreaterThanOrEqual(1);
      expect(page2.totalCount).toBe(page1.totalCount);

      // Vérifier qu'il n'y a pas de doublons entre les pages
      const page1Ids = page1.plans.map((p) => p.id);
      const page2Ids = page2.plans.map((p) => p.id);
      const intersection = page1Ids.filter((id) => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });

    test('Lister avec succès les plans triés par nom croissant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des plans avec des noms spécifiques
      const planB = await caller.plans.upsert({
        nom: 'B - Plan',
        collectiviteId: collectivite.id,
      });

      const planA = await caller.plans.upsert({
        nom: 'A - Plan',
        collectiviteId: collectivite.id,
      });

      const planC = await caller.plans.upsert({
        nom: 'C - Plan',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.delete({ planId: planA.id });
        await cleanupCaller.plans.delete({ planId: planB.id });
        await cleanupCaller.plans.delete({ planId: planC.id });
      });

      const result = await caller.plans.list({
        collectiviteId: collectivite.id,
        sort: {
          field: 'nom',
          direction: 'asc',
        },
      });

      // Vérifier que les plans sont triés par nom (au moins les 3 créés)
      const createdPlans = result.plans.filter((p) =>
        [planA.id, planB.id, planC.id].includes(p.id)
      );
      expect(createdPlans.length).toBeGreaterThanOrEqual(3);

      // Vérifier l'ordre pour les plans créés
      const planAIndex = createdPlans.findIndex((p) => p.id === planA.id);
      const planBIndex = createdPlans.findIndex((p) => p.id === planB.id);
      const planCIndex = createdPlans.findIndex((p) => p.id === planC.id);

      expect(planAIndex).toBeLessThan(planBIndex);
      expect(planBIndex).toBeLessThan(planCIndex);
    });

    test('Lister avec succès les plans triés par nom décroissant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des plans avec des noms spécifiques
      const planB = await caller.plans.upsert({
        nom: 'Z - Plan',
        collectiviteId: collectivite.id,
      });

      const planA = await caller.plans.upsert({
        nom: 'Y - Plan',
        collectiviteId: collectivite.id,
      });

      const planC = await caller.plans.upsert({
        nom: 'X - Plan',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.delete({ planId: planA.id });
        await cleanupCaller.plans.delete({ planId: planB.id });
        await cleanupCaller.plans.delete({ planId: planC.id });
      });

      const result = await caller.plans.list({
        collectiviteId: collectivite.id,
        sort: {
          field: 'nom',
          direction: 'desc',
        },
      });

      // Vérifier que les plans sont triés par nom décroissant
      const createdPlans = result.plans.filter((p) =>
        [planA.id, planB.id, planC.id].includes(p.id)
      );
      expect(createdPlans.length).toBeGreaterThanOrEqual(3);

      // Vérifier l'ordre pour les plans créés (ordre décroissant)
      const planAIndex = createdPlans.findIndex((p) => p.id === planA.id);
      const planBIndex = createdPlans.findIndex((p) => p.id === planB.id);
      const planCIndex = createdPlans.findIndex((p) => p.id === planC.id);

      expect(planBIndex).toBeLessThan(planAIndex);
      expect(planAIndex).toBeLessThan(planCIndex);
    });

    test('Lister avec succès les plans triés par createdAt croissant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des plans avec un délai pour avoir des createdAt différents
      const plan1 = await caller.plans.upsert({
        nom: 'Plan createdAt 1',
        collectiviteId: collectivite.id,
      });

      // Petit délai pour s'assurer que les dates sont différentes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const plan2 = await caller.plans.upsert({
        nom: 'Plan createdAt 2',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.delete({ planId: plan1.id });
        await cleanupCaller.plans.delete({ planId: plan2.id });
      });

      const result = await caller.plans.list({
        collectiviteId: collectivite.id,
        sort: {
          field: 'createdAt',
          direction: 'asc',
        },
      });

      // Vérifier que les plans sont triés par createdAt
      const createdPlans = result.plans.filter((p) =>
        [plan1.id, plan2.id].includes(p.id)
      );
      expect(createdPlans.length).toBeGreaterThanOrEqual(2);

      // Vérifier l'ordre pour les plans créés
      const plan1Index = createdPlans.findIndex((p) => p.id === plan1.id);
      const plan2Index = createdPlans.findIndex((p) => p.id === plan2.id);

      expect(plan1Index).toBeLessThan(plan2Index);
    });
  });

  describe("Lister les plans - Droits d'accès", () => {
    test('Un utilisateur sans droits sur la collectivité ne peut pas lister les plans', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.plans.list({
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité peut lister les plans', async () => {
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
      const createdPlan = await adminCaller.plans.upsert({
        nom: 'Plan pour lecture',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.delete({ planId: createdPlan.id });
      });

      const result = await caller.plans.list({
        collectiviteId: collectivite.id,
      });

      expect(result).toBeDefined();
      expect(result.plans).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(1);
      expect(result.plans.map((p) => p.id)).toContain(createdPlan.id);
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas lister les plans", async () => {
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
      const createdPlan = await adminCaller.plans.upsert({
        nom: 'Plan pour édition limitée',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.delete({ planId: createdPlan.id });
      });

      await expect(
        caller.plans.list({
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });
});
