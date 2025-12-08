import { addTestCollectiviteAndUser } from '@/backend/collectivites/collectivites/collectivites.fixture';
import { Collectivite } from '@/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@/backend/test';
import { CollectiviteAccessLevelEnum } from '@/backend/users/authorizations/roles/collectivite-access-level.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { addTestUser } from '@/backend/users/users/users.fixture';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { onTestFinished } from 'vitest';

describe('Supprimer un plan', () => {
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

  describe('Supprimer un plan - Cas de succès', () => {
    test('Supprimer avec succès un plan unique sans axes enfants', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan
      const createdPlan = await caller.plans.upsert({
        nom: 'Plan à supprimer',
        collectiviteId: collectivite.id,
      });
      const planId = createdPlan.id;

      // Vérifier que le plan existe avant suppression
      const planBefore = await caller.plans.get({ planId });
      expect(planBefore).toBeDefined();
      expect(planBefore.id).toBe(planId);

      // Supprimer le plan
      await caller.plans.delete({ planId });

      // Vérifier que le plan n'existe plus
      await expect(caller.plans.get({ planId })).rejects.toThrow(
        "Le plan demandé n'a pas été trouvé"
      );
    });

    test('Supprimer avec succès un plan avec des axes enfants directs', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan
      const createdPlan = await caller.plans.upsert({
        nom: 'Plan avec axes enfants',
        collectiviteId: collectivite.id,
      });
      const planId = createdPlan.id;

      // Créer des axes enfants
      const childAxe1 = await caller.plans.axes.upsert({
        nom: 'Axe enfant 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const childAxe2 = await caller.plans.axes.upsert({
        nom: 'Axe enfant 2',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Vérifier que tous les axes existent avant suppression
      const planBefore = await caller.plans.get({ planId });
      expect(planBefore).toBeDefined();
      expect(planBefore.axes.length).toBeGreaterThanOrEqual(2);

      const child1Before = await caller.plans.axes.get({ axeId: childAxe1.id });
      expect(child1Before).toBeDefined();

      const child2Before = await caller.plans.axes.get({ axeId: childAxe2.id });
      expect(child2Before).toBeDefined();

      // Supprimer le plan (devrait supprimer récursivement les axes enfants)
      await caller.plans.delete({ planId });

      // Vérifier que le plan et tous les axes ont été supprimés
      await expect(caller.plans.get({ planId })).rejects.toThrow(
        "Le plan demandé n'a pas été trouvé"
      );

      await expect(
        caller.plans.axes.get({ axeId: childAxe1.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");

      await expect(
        caller.plans.axes.get({ axeId: childAxe2.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");
    });

    test("Supprimer avec succès un plan avec une hiérarchie d'axes imbriquée", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan
      const createdPlan = await caller.plans.upsert({
        nom: 'Plan avec hiérarchie',
        collectiviteId: collectivite.id,
      });
      const planId = createdPlan.id;

      // Créer une hiérarchie: plan -> axe niveau 1 -> axe niveau 2
      const level1Axe = await caller.plans.axes.upsert({
        nom: 'Axe niveau 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const level2Axe1 = await caller.plans.axes.upsert({
        nom: 'Axe niveau 2-1',
        collectiviteId: collectivite.id,
        planId,
        parent: level1Axe.id,
      });

      const level2Axe2 = await caller.plans.axes.upsert({
        nom: 'Axe niveau 2-2',
        collectiviteId: collectivite.id,
        planId,
        parent: level1Axe.id,
      });

      // Vérifier que tous les axes existent avant suppression
      const planBefore = await caller.plans.get({ planId });
      expect(planBefore).toBeDefined();

      const level1Before = await caller.plans.axes.get({
        axeId: level1Axe.id,
      });
      expect(level1Before).toBeDefined();

      const level2aBefore = await caller.plans.axes.get({
        axeId: level2Axe1.id,
      });
      expect(level2aBefore).toBeDefined();

      const level2bBefore = await caller.plans.axes.get({
        axeId: level2Axe2.id,
      });
      expect(level2bBefore).toBeDefined();

      // Supprimer le plan (devrait supprimer récursivement toute la hiérarchie)
      await caller.plans.delete({ planId });

      // Vérifier que tous les axes ont été supprimés
      await expect(caller.plans.get({ planId })).rejects.toThrow(
        "Le plan demandé n'a pas été trouvé"
      );

      await expect(
        caller.plans.axes.get({ axeId: level1Axe.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");

      await expect(
        caller.plans.axes.get({ axeId: level2Axe1.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");

      await expect(
        caller.plans.axes.get({ axeId: level2Axe2.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");
    });

    test("Supprimer avec succès un plan et vérifier qu'il est retiré de la liste", async () => {
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
        try {
          await cleanupCaller.plans.delete({ planId: plan1.id });
        } catch {
          // Ignore si déjà supprimé
        }
        try {
          await cleanupCaller.plans.delete({ planId: plan3.id });
        } catch {
          // Ignore si déjà supprimé
        }
      });

      // Vérifier que tous les plans sont dans la liste
      const listBefore = await caller.plans.list({
        collectiviteId: collectivite.id,
      });
      const planIdsBefore = listBefore.plans.map((p) => p.id);
      expect(planIdsBefore).toContain(plan1.id);
      expect(planIdsBefore).toContain(plan2.id);
      expect(planIdsBefore).toContain(plan3.id);

      // Supprimer un plan
      await caller.plans.delete({ planId: plan2.id });

      // Vérifier que le plan supprimé n'est plus dans la liste
      const listAfter = await caller.plans.list({
        collectiviteId: collectivite.id,
      });
      const planIdsAfter = listAfter.plans.map((p) => p.id);
      expect(planIdsAfter).not.toContain(plan2.id);
      expect(planIdsAfter).toContain(plan1.id);
      expect(planIdsAfter).toContain(plan3.id);
    });
  });

  describe("Supprimer un plan - Cas d'erreur", () => {
    test('Impossible de supprimer un plan inexistant', async () => {
      const caller = router.createCaller({ user: editorUser });

      const nonExistentPlanId = 999999;

      await expect(
        caller.plans.delete({ planId: nonExistentPlanId })
      ).rejects.toThrow("Le plan demandé n'a pas été trouvé");
    });

    test('Un utilisateur sans droits sur la collectivité ne peut pas supprimer un plan', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan avec l'utilisateur admin
      const createdPlan = await caller.plans.upsert({
        nom: 'Plan pour test permissions',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        try {
          await cleanupCaller.plans.delete({
            planId: createdPlan.id,
          });
        } catch {
          // Ignore si déjà supprimé
        }
      });

      // Utilisateur sans droits
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const unauthorizedCaller = router.createCaller({ user: yoloDodoUser });

      await expect(
        unauthorizedCaller.plans.delete({ planId: createdPlan.id })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité ne peut pas supprimer un plan', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan avec l'utilisateur admin
      const createdPlan = await caller.plans.upsert({
        nom: 'Plan pour test lecture',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        try {
          await cleanupCaller.plans.delete({
            planId: createdPlan.id,
          });
        } catch {
          // Ignore si déjà supprimé
        }
      });

      // Utilisateur avec droits de lecture uniquement
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const lectureCaller = router.createCaller({ user: lectureUser });

      await expect(
        lectureCaller.plans.delete({ planId: createdPlan.id })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas supprimer un plan", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan avec l'utilisateur admin
      const createdPlan = await caller.plans.upsert({
        nom: 'Plan pour test édition limitée',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        try {
          await cleanupCaller.plans.delete({
            planId: createdPlan.id,
          });
        } catch {
          // Ignore si déjà supprimé
        }
      });

      // Utilisateur avec droits d'édition limités
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromDcp(user);
      const limitedEditionCaller = router.createCaller({
        user: limitedEditionUser,
      });

      await expect(
        limitedEditionCaller.plans.delete({ planId: createdPlan.id })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });

  describe('Supprimer un plan - Cas limites', () => {
    test("La suppression d'un plan n'affecte pas les autres plans", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer plusieurs plans
      const plan1 = await caller.plans.upsert({
        nom: 'Plan frère 1',
        collectiviteId: collectivite.id,
      });

      const plan2 = await caller.plans.upsert({
        nom: 'Plan frère 2',
        collectiviteId: collectivite.id,
      });

      const plan3 = await caller.plans.upsert({
        nom: 'Plan frère 3',
        collectiviteId: collectivite.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        try {
          await cleanupCaller.plans.delete({ planId: plan1.id });
        } catch {
          // Ignore si déjà supprimé
        }
        try {
          await cleanupCaller.plans.delete({ planId: plan3.id });
        } catch {
          // Ignore si déjà supprimé
        }
      });

      // Vérifier que tous les plans existent
      const plan1Before = await caller.plans.get({ planId: plan1.id });
      expect(plan1Before).toBeDefined();

      const plan2Before = await caller.plans.get({ planId: plan2.id });
      expect(plan2Before).toBeDefined();

      const plan3Before = await caller.plans.get({ planId: plan3.id });
      expect(plan3Before).toBeDefined();

      // Supprimer seulement plan2
      await caller.plans.delete({ planId: plan2.id });

      // Vérifier que plan2 est supprimé mais plan1 et plan3 existent toujours
      await expect(caller.plans.get({ planId: plan2.id })).rejects.toThrow(
        "Le plan demandé n'a pas été trouvé"
      );

      const plan1After = await caller.plans.get({ planId: plan1.id });
      expect(plan1After).toBeDefined();
      expect(plan1After.id).toBe(plan1.id);

      const plan3After = await caller.plans.get({ planId: plan3.id });
      expect(plan3After).toBeDefined();
      expect(plan3After.id).toBe(plan3.id);
    });

    test("La suppression d'un plan avec plusieurs niveaux d'axes supprime tous les descendants", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un plan
      const createdPlan = await caller.plans.upsert({
        nom: 'Plan avec hiérarchie complexe',
        collectiviteId: collectivite.id,
      });
      const planId = createdPlan.id;

      // Créer une hiérarchie complexe
      const level1 = await caller.plans.axes.upsert({
        nom: 'Niveau 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const level2a = await caller.plans.axes.upsert({
        nom: 'Niveau 2a',
        collectiviteId: collectivite.id,
        planId,
        parent: level1.id,
      });

      const level2b = await caller.plans.axes.upsert({
        nom: 'Niveau 2b',
        collectiviteId: collectivite.id,
        planId,
        parent: level1.id,
      });

      const level3a = await caller.plans.axes.upsert({
        nom: 'Niveau 3a',
        collectiviteId: collectivite.id,
        planId,
        parent: level2a.id,
      });

      const level3b = await caller.plans.axes.upsert({
        nom: 'Niveau 3b',
        collectiviteId: collectivite.id,
        planId,
        parent: level2a.id,
      });

      const level4 = await caller.plans.axes.upsert({
        nom: 'Niveau 4',
        collectiviteId: collectivite.id,
        planId,
        parent: level3a.id,
      });

      // Vérifier que tous les axes existent
      const allAxes = [
        level1.id,
        level2a.id,
        level2b.id,
        level3a.id,
        level3b.id,
        level4.id,
      ];

      for (const axeId of allAxes) {
        const axe = await caller.plans.axes.get({ axeId });
        expect(axe).toBeDefined();
      }

      // Supprimer le plan (devrait supprimer toute la hiérarchie)
      await caller.plans.delete({ planId });

      // Vérifier que le plan et tous les axes ont été supprimés
      await expect(caller.plans.get({ planId })).rejects.toThrow(
        "Le plan demandé n'a pas été trouvé"
      );

      for (const axeId of allAxes) {
        await expect(caller.plans.axes.get({ axeId })).rejects.toThrow(
          "L'axe demandé n'a pas été trouvé"
        );
      }
    });
  });
});
