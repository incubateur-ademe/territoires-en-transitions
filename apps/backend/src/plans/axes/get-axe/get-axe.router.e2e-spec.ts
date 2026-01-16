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
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';

describe('Récupérer un axe', () => {
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
        accessLevel: CollectiviteRole.ADMIN,
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

  describe('Récupérer un axe - Cas de succès', () => {
    test('Récupérer avec succès un axe existant', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe à récupérer',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      const result = await caller.plans.axes.get({
        axeId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(axeId);
      expect(result.nom).toBe('Axe à récupérer');
      expect(result.collectiviteId).toBe(collectivite.id);
      expect(result.parent).toBe(planId);
      expect(result.plan).toBe(planId);
      expect(result.createdAt).toBeDefined();
      expect(result.modifiedAt).toBeDefined();
      expect(result.indicateurs).toBeDefined();
      expect(Array.isArray(result.indicateurs)).toBe(true);
      expect(result.indicateurs).toHaveLength(0);
    });

    test('Récupérer avec succès un axe imbriqué (axe enfant)', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe parent
      const parentAxe = await caller.plans.axes.create({
        nom: 'Axe parent',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Créer un axe enfant
      const childAxe = await caller.plans.axes.create({
        nom: 'Axe enfant',
        collectiviteId: collectivite.id,
        planId,
        parent: parentAxe.id,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: childAxe.id });
        await cleanupCaller.plans.axes.delete({ axeId: parentAxe.id });
      });

      const result = await caller.plans.axes.get({
        axeId: childAxe.id,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(childAxe.id);
      expect(result.nom).toBe('Axe enfant');
      expect(result.parent).toBe(parentAxe.id);
      expect(result.plan).toBe(planId);
      expect(result.indicateurs).toBeDefined();
      expect(Array.isArray(result.indicateurs)).toBe(true);
    });

    test('Récupérer avec succès un axe avec des indicateurs associés', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des indicateurs de test
      const indicateur1Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur 1 pour récupération',
        unite: 'kg',
      });

      const indicateur2Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur 2 pour récupération',
        unite: 'm²',
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur1Id,
          collectiviteId: collectivite.id,
        });
        await cleanupCaller.indicateurs.indicateurs.delete({
          indicateurId: indicateur2Id,
          collectiviteId: collectivite.id,
        });
      });

      // Créer un axe avec des indicateurs
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe avec indicateurs à récupérer',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
        indicateurs: [{ id: indicateur1Id }, { id: indicateur2Id }],
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      const result = await caller.plans.axes.get({
        axeId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(axeId);
      expect(result.nom).toBe('Axe avec indicateurs à récupérer');
      expect(result.indicateurs).toBeDefined();
      expect(Array.isArray(result.indicateurs)).toBe(true);
      expect(result.indicateurs).toHaveLength(2);
      expect(result.indicateurs.map((ind) => ind.id)).toEqual(
        expect.arrayContaining([indicateur1Id, indicateur2Id])
      );
      expect(result.indicateurs[0]).toHaveProperty('id');
      expect(result.indicateurs[0]).toHaveProperty('titre');
      expect(result.indicateurs[0]).toHaveProperty('unite');
      expect(result.indicateurs[0].titre).toBeDefined();
      expect(result.indicateurs[1].titre).toBeDefined();
      expect(result.indicateurs[1].unite).toBeDefined();
    });
  });

  describe("Récupérer un axe - Cas d'erreur", () => {
    test("Échec de récupération d'un axe inexistant", async () => {
      const caller = router.createCaller({ user: editorUser });

      const nonExistentAxeId = 999999;

      await expect(
        caller.plans.axes.get({
          axeId: nonExistentAxeId,
        })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");
    });

    test("Échec de récupération d'un axe avec un axeId invalide (négatif)", async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.plans.axes.get({
          axeId: -1,
        })
      ).rejects.toThrow();
    });

    test("Échec de récupération d'un axe avec un axeId invalide (zéro)", async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.plans.axes.get({
          axeId: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe("Récupérer un axe - Droits d'accès", () => {
    test('Un utilisateur sans droits sur la collectivité ne peut pas récupérer un axe', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe avec l'utilisateur admin
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe pour test permissions',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: createdAxe.id });
      });

      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const unauthorizedCaller = router.createCaller({ user: yoloDodoUser });

      await expect(
        unauthorizedCaller.plans.axes.get({
          axeId: createdAxe.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité peut récupérer un axe', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteRole.LECTURE,
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

      const result = await caller.plans.axes.get({
        axeId: createdAxe.id,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdAxe.id);
      expect(result.nom).toBe('Axe pour lecture');
      expect(result.collectiviteId).toBe(collectivite.id);
      expect(result.indicateurs).toBeDefined();
      expect(Array.isArray(result.indicateurs)).toBe(true);
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas récupérer un axe", async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteRole.EDITION_FICHES_INDICATEURS,
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
        caller.plans.axes.get({
          axeId: createdAxe.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test("Un utilisateur avec des droits d'édition sur la collectivité peut récupérer un axe", async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteRole.EDITION,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const editionUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: editionUser });

      // Créer un axe avec l'utilisateur admin
      const adminCaller = router.createCaller({ user: editorUser });
      const createdAxe = await adminCaller.plans.axes.create({
        nom: 'Axe pour édition',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId: createdAxe.id });
      });

      const result = await caller.plans.axes.get({
        axeId: createdAxe.id,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(createdAxe.id);
      expect(result.nom).toBe('Axe pour édition');
      expect(result.indicateurs).toBeDefined();
      expect(Array.isArray(result.indicateurs)).toBe(true);
    });
  });
});
