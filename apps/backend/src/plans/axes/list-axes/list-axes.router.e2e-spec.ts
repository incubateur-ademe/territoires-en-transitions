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

describe('Lister les axes', () => {
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

  describe('Lister les axes - Cas de succès', () => {
    test('Lister avec succès des axes vides', async () => {
      const caller = router.createCaller({ user: editorUser });

      const result = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
      });

      expect(result).toEqual({
        axes: [],
        totalCount: 0,
      });
    });

    test('Lister avec succès un axe unique', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe unique',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      const result = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
      });

      expect(result.totalCount).toBe(1);
      expect(result.axes).toHaveLength(1);
      expect(result.axes[0]).toEqual(
        expect.objectContaining({
          id: axeId,
          nom: 'Axe unique',
          collectiviteId: collectivite.id,
          parent: planId,
        })
      );
    });

    test('Lister avec succès plusieurs axes', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer plusieurs axes
      const axe1 = await caller.plans.axes.create({
        nom: 'Axe 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axe2 = await caller.plans.axes.create({
        nom: 'Axe 2',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axe3 = await caller.plans.axes.create({
        nom: 'Axe 3',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: axe1.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe2.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe3.id });
      });

      const result = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
      });

      expect(result.totalCount).toBeGreaterThanOrEqual(3);
      expect(result.axes.length).toBeGreaterThanOrEqual(3);
      expect(result.axes.map((a) => a.id)).toEqual(
        expect.arrayContaining([axe1.id, axe2.id, axe3.id])
      );
    });

    test('Lister avec succès les axes avec une limite', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer plusieurs axes
      const axe1 = await caller.plans.axes.create({
        nom: 'Axe limit 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axe2 = await caller.plans.axes.create({
        nom: 'Axe limit 2',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: axe1.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe2.id });
      });

      const result = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
        limit: 1,
      });

      expect(result.axes).toHaveLength(1);
      expect(result.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('Lister avec succès les axes avec pagination', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer plusieurs axes
      const axe1 = await caller.plans.axes.create({
        nom: 'Axe page 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axe2 = await caller.plans.axes.create({
        nom: 'Axe page 2',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axe3 = await caller.plans.axes.create({
        nom: 'Axe page 3',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: axe1.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe2.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe3.id });
      });

      // Première page
      const page1 = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
        limit: 2,
        page: 1,
      });

      expect(page1.axes).toHaveLength(2);
      expect(page1.totalCount).toBeGreaterThanOrEqual(3);

      // Deuxième page
      const page2 = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
        limit: 2,
        page: 2,
      });

      expect(page2.axes.length).toBeGreaterThanOrEqual(1);
      expect(page2.totalCount).toBe(page1.totalCount);

      // Vérifier qu'il n'y a pas de doublons entre les pages
      const page1Ids = page1.axes.map((a) => a.id);
      const page2Ids = page2.axes.map((a) => a.id);
      const intersection = page1Ids.filter((id) => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });

    test('Lister avec succès les axes triés par nom croissant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des axes avec des noms spécifiques
      const axeB = await caller.plans.axes.create({
        nom: 'B - Axe',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axeA = await caller.plans.axes.create({
        nom: 'A - Axe',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axeC = await caller.plans.axes.create({
        nom: 'C - Axe',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: axeA.id });
        await cleanupCaller.plans.axes.delete({ axeId: axeB.id });
        await cleanupCaller.plans.axes.delete({ axeId: axeC.id });
      });

      const result = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
        sort: {
          field: 'nom',
          direction: 'asc',
        },
      });

      // Vérifier que les axes sont triés par nom (au moins les 3 créés)
      const createdAxes = result.axes.filter((a) =>
        [axeA.id, axeB.id, axeC.id].includes(a.id)
      );
      expect(createdAxes.length).toBeGreaterThanOrEqual(3);

      // Vérifier l'ordre pour les axes créés
      const axeAIndex = createdAxes.findIndex((a) => a.id === axeA.id);
      const axeBIndex = createdAxes.findIndex((a) => a.id === axeB.id);
      const axeCIndex = createdAxes.findIndex((a) => a.id === axeC.id);

      expect(axeAIndex).toBeLessThan(axeBIndex);
      expect(axeBIndex).toBeLessThan(axeCIndex);
    });

    test('Lister avec succès les axes triés par nom décroissant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des axes avec des noms spécifiques
      const axeB = await caller.plans.axes.create({
        nom: 'Z - Axe',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axeA = await caller.plans.axes.create({
        nom: 'Y - Axe',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axeC = await caller.plans.axes.create({
        nom: 'X - Axe',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: axeA.id });
        await cleanupCaller.plans.axes.delete({ axeId: axeB.id });
        await cleanupCaller.plans.axes.delete({ axeId: axeC.id });
      });

      const result = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
        sort: {
          field: 'nom',
          direction: 'desc',
        },
      });

      // Vérifier que les axes sont triés par nom décroissant
      const createdAxes = result.axes.filter((a) =>
        [axeA.id, axeB.id, axeC.id].includes(a.id)
      );
      expect(createdAxes.length).toBeGreaterThanOrEqual(3);

      // Vérifier l'ordre pour les axes créés (ordre décroissant)
      const axeAIndex = createdAxes.findIndex((a) => a.id === axeA.id);
      const axeBIndex = createdAxes.findIndex((a) => a.id === axeB.id);
      const axeCIndex = createdAxes.findIndex((a) => a.id === axeC.id);

      expect(axeBIndex).toBeLessThan(axeAIndex);
      expect(axeAIndex).toBeLessThan(axeCIndex);
    });

    test('Lister avec succès les axes triés par createdAt croissant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des axes avec un délai pour avoir des createdAt différents
      const axe1 = await caller.plans.axes.create({
        nom: 'Axe createdAt 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Petit délai pour s'assurer que les dates sont différentes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const axe2 = await caller.plans.axes.create({
        nom: 'Axe createdAt 2',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: axe1.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe2.id });
      });

      const result = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
        sort: {
          field: 'createdAt',
          direction: 'asc',
        },
      });

      // Vérifier que les axes sont triés par createdAt
      const createdAxes = result.axes.filter((a) =>
        [axe1.id, axe2.id].includes(a.id)
      );
      expect(createdAxes.length).toBeGreaterThanOrEqual(2);

      // Vérifier l'ordre pour les axes créés
      const axe1Index = createdAxes.findIndex((a) => a.id === axe1.id);
      const axe2Index = createdAxes.findIndex((a) => a.id === axe2.id);

      expect(axe1Index).toBeLessThan(axe2Index);
    });

    test('Lister avec succès les axes triés par createdAt décroissant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des axes avec un délai pour avoir des createdAt différents
      const axe1 = await caller.plans.axes.create({
        nom: 'Axe createdAt desc 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Petit délai pour s'assurer que les dates sont différentes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const axe2 = await caller.plans.axes.create({
        nom: 'Axe createdAt desc 2',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: axe1.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe2.id });
      });

      const result = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
        sort: {
          field: 'createdAt',
          direction: 'desc',
        },
      });

      // Vérifier que les axes sont triés par createdAt décroissant
      const createdAxes = result.axes.filter((a) =>
        [axe1.id, axe2.id].includes(a.id)
      );
      expect(createdAxes.length).toBeGreaterThanOrEqual(2);

      // Vérifier l'ordre pour les axes créés (ordre décroissant)
      const axe1Index = createdAxes.findIndex((a) => a.id === axe1.id);
      const axe2Index = createdAxes.findIndex((a) => a.id === axe2.id);

      expect(axe2Index).toBeLessThan(axe1Index);
    });
  });

  describe("Lister les axes - Droits d'accès", () => {
    test('Un utilisateur sans droits sur la collectivité ne peut pas lister les axes', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.plans.axes.list({
          parentId: planId,
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité peut lister les axes', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      // Créer un axe avec l'utilisateur admin
      const adminCaller = router.createCaller({ user: editorUser });
      const createdAxe = await adminCaller.plans.axes.create({
        nom: 'Axe pour lecture',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: createdAxe.id });
      });

      const result = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
      });

      expect(result).toBeDefined();
      expect(result.axes).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(1);
      expect(result.axes.map((a) => a.id)).toContain(createdAxe.id);
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas lister les axes", async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: limitedEditionUser });

      // Créer un axe avec l'utilisateur admin
      const adminCaller = router.createCaller({ user: editorUser });
      const createdAxe = await adminCaller.plans.axes.create({
        nom: 'Axe pour édition limitée',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: createdAxe.id });
      });

      await expect(
        caller.plans.axes.list({
          parentId: planId,
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });

  describe('Lister les axes récursivement - Cas de succès', () => {
    test('Lister avec succès récursivement avec des axes vides (seulement le parent)', async () => {
      const caller = router.createCaller({ user: editorUser });

      const result = await caller.plans.axes.listRecursively({
        parentId: planId,
        collectiviteId: collectivite.id,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      // Le parent doit être présent avec depth 0
      const parentAxe = result.find((a) => a.id === planId);
      expect(parentAxe).toBeDefined();
      expect(parentAxe?.depth).toBe(0);
    });

    test('Lister avec succès récursivement avec un axe enfant unique', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe enfant
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe enfant unique',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      const result = await caller.plans.axes.listRecursively({
        parentId: planId,
        collectiviteId: collectivite.id,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2); // Parent + enfant

      const parentAxe = result.find((a) => a.id === planId);
      expect(parentAxe).toBeDefined();
      expect(parentAxe?.depth).toBe(0);

      const childAxe = result.find((a) => a.id === axeId);
      expect(childAxe).toBeDefined();
      expect(childAxe?.nom).toBe('Axe enfant unique');
      expect(childAxe?.depth).toBe(1);
      expect(childAxe?.parent).toBe(planId);
    });

    test('Lister avec succès récursivement avec plusieurs axes enfants', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer plusieurs axes enfants
      const axe1 = await caller.plans.axes.create({
        nom: 'Axe enfant 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axe2 = await caller.plans.axes.create({
        nom: 'Axe enfant 2',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axe3 = await caller.plans.axes.create({
        nom: 'Axe enfant 3',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: axe1.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe2.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe3.id });
      });

      const result = await caller.plans.axes.listRecursively({
        parentId: planId,
        collectiviteId: collectivite.id,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(4); // Parent + 3 enfants

      const parentAxe = result.find((a) => a.id === planId);
      expect(parentAxe).toBeDefined();
      expect(parentAxe?.depth).toBe(0);

      const childAxes = result.filter((a) =>
        [axe1.id, axe2.id, axe3.id].includes(a.id)
      );
      expect(childAxes.length).toBe(3);
      childAxes.forEach((axe) => {
        expect(axe.depth).toBe(1);
        expect(axe.parent).toBe(planId);
      });
    });

    test('Lister avec succès récursivement avec une hiérarchie imbriquée', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe de niveau 1
      const axe1 = await caller.plans.axes.create({
        nom: 'Axe niveau 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Créer un axe de niveau 2 (enfant de axe1)
      const axe2 = await caller.plans.axes.create({
        nom: 'Axe niveau 2',
        collectiviteId: collectivite.id,
        planId,
        parent: axe1.id,
      });

      // Créer trois axes de niveau 3 (enfants de axe2)
      const axe3B = await caller.plans.axes.create({
        nom: 'Axe niveau 3 (B)',
        collectiviteId: collectivite.id,
        planId,
        parent: axe2.id,
      });
      const axe3A = await caller.plans.axes.create({
        nom: 'Axe niveau 3 (A)',
        collectiviteId: collectivite.id,
        planId,
        parent: axe2.id,
      });
      const axe3C = await caller.plans.axes.create({
        nom: 'Axe niveau 3 (C)',
        collectiviteId: collectivite.id,
        planId,
        parent: axe2.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        // Supprimer dans l'ordre inverse (du plus profond au moins profond)
        await cleanupCaller.plans.axes.delete({ axeId: axe3A.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe3B.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe3C.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe2.id });
        await cleanupCaller.plans.axes.delete({ axeId: axe1.id });
      });

      const result = await caller.plans.axes.listRecursively({
        parentId: planId,
        collectiviteId: collectivite.id,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(4); // Parent + 3 niveaux
      expect(result).toEqual([
        {
          depth: 0,
          id: planId,
          nom: 'Plan de test',
          description: null,
          parent: null,
          fiches: [],
        },
        {
          depth: 1,
          id: axe1.id,
          nom: 'Axe niveau 1',
          description: null,
          parent: planId,
          fiches: [],
        },
        {
          depth: 2,
          id: axe2.id,
          nom: 'Axe niveau 2',
          description: null,
          parent: axe1.id,
          fiches: [],
        },
        {
          depth: 3,
          id: axe3A.id,
          nom: 'Axe niveau 3 (A)',
          description: null,
          parent: axe2.id,
          fiches: [],
        },
        {
          depth: 3,
          id: axe3B.id,
          nom: 'Axe niveau 3 (B)',
          description: null,
          parent: axe2.id,
          fiches: [],
        },
        {
          depth: 3,
          id: axe3C.id,
          nom: 'Axe niveau 3 (C)',
          description: null,
          parent: axe2.id,
          fiches: [],
        },
      ]);
    });

    test("Lister avec succès récursivement à partir d'un axe enfant", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe parent
      const parentAxe = await caller.plans.axes.create({
        nom: 'Axe parent pour test',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Créer des axes enfants
      const childAxe1 = await caller.plans.axes.create({
        nom: 'Enfant 1',
        collectiviteId: collectivite.id,
        planId,
        parent: parentAxe.id,
      });

      const childAxe2 = await caller.plans.axes.create({
        nom: 'Enfant 2',
        collectiviteId: collectivite.id,
        planId,
        parent: parentAxe.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: childAxe1.id });
        await cleanupCaller.plans.axes.delete({ axeId: childAxe2.id });
        await cleanupCaller.plans.axes.delete({ axeId: parentAxe.id });
      });

      // Lister récursivement à partir de l'axe parent (pas du plan)
      const result = await caller.plans.axes.listRecursively({
        parentId: parentAxe.id,
        collectiviteId: collectivite.id,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3); // Parent + 2 enfants
      expect(result).toEqual([
        {
          depth: 0,
          id: parentAxe.id,
          nom: 'Axe parent pour test',
          description: null,
          parent: null,
          fiches: [],
        },
        {
          depth: 1,
          id: childAxe1.id,
          nom: 'Enfant 1',
          description: null,
          parent: parentAxe.id,
          fiches: [],
        },
        {
          depth: 1,
          id: childAxe2.id,
          nom: 'Enfant 2',
          description: null,
          parent: parentAxe.id,
          fiches: [],
        },
      ]);
    });
  });

  describe("Lister les axes récursivement - Droits d'accès", () => {
    test('Un utilisateur sans droits sur la collectivité ne peut pas lister les axes récursivement', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.plans.axes.listRecursively({
          parentId: planId,
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité peut lister les axes récursivement', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      // Créer un axe avec l'utilisateur admin
      const adminCaller = router.createCaller({ user: editorUser });
      const createdAxe = await adminCaller.plans.axes.create({
        nom: 'Axe pour lecture récursive',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: createdAxe.id });
      });

      const result = await caller.plans.axes.listRecursively({
        parentId: planId,
        collectiviteId: collectivite.id,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2); // Parent + enfant
      expect(result.map((a) => a.id)).toContain(planId);
      expect(result.map((a) => a.id)).toContain(createdAxe.id);
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas lister les axes récursivement", async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: limitedEditionUser });

      // Créer un axe avec l'utilisateur admin
      const adminCaller = router.createCaller({ user: editorUser });
      const createdAxe = await adminCaller.plans.axes.create({
        nom: 'Axe pour édition limitée récursive',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: createdAxe.id });
      });

      await expect(
        caller.plans.axes.listRecursively({
          parentId: planId,
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });
});
