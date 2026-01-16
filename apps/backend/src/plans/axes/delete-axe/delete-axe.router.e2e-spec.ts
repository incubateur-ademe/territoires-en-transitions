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
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { axeIndicateurTable } from '../../fiches/shared/models/axe-indicateur.table';
import { axeTable } from '../../fiches/shared/models/axe.table';

describe('Supprimer un axe', () => {
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

    return async () => {
      await testCollectiviteAndUserResult.cleanup();
    };
  });

  beforeEach(async () => {
    // Créer un plan pour les tests
    const [plan] = await db.db
      .insert(axeTable)
      .values([
        {
          nom: 'Plan de test',
          collectiviteId: collectivite.id,
        },
      ])
      .returning();
    planId = plan.id;
  });

  afterEach(async () => {
    await db.db.delete(axeTable).where(eq(axeTable.plan, planId));
  });

  describe('Supprimer un axe - Cas de succès', () => {
    test('Supprimer avec succès un axe unique sans enfants', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe à supprimer',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });
      const axeId = createdAxe.id;

      // Vérifier que l'axe existe avant suppression
      const axeBefore = await caller.plans.axes.get({ axeId });
      expect(axeBefore).toBeDefined();
      expect(axeBefore.id).toBe(axeId);

      // Supprimer l'axe
      await caller.plans.axes.delete({ axeId });

      // Vérifier que l'axe n'existe plus
      await expect(caller.plans.axes.get({ axeId })).rejects.toThrow(
        "L'axe demandé n'a pas été trouvé"
      );
    });

    test('Supprimer avec succès un axe avec des enfants directs', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe parent
      const parentAxe = await caller.plans.axes.create({
        nom: 'Axe parent à supprimer',
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

      // Vérifier que tous les axes existent avant suppression
      const parentBefore = await caller.plans.axes.get({ axeId: parentAxe.id });
      expect(parentBefore).toBeDefined();

      const child1Before = await caller.plans.axes.get({ axeId: childAxe1.id });
      expect(child1Before).toBeDefined();

      const child2Before = await caller.plans.axes.get({ axeId: childAxe2.id });
      expect(child2Before).toBeDefined();

      // Supprimer l'axe parent (devrait supprimer récursivement les enfants)
      await caller.plans.axes.delete({ axeId: parentAxe.id });

      // Vérifier que tous les axes ont été supprimés
      await expect(
        caller.plans.axes.get({ axeId: parentAxe.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");

      await expect(
        caller.plans.axes.get({ axeId: childAxe1.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");

      await expect(
        caller.plans.axes.get({ axeId: childAxe2.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");
    });

    test('Supprimer avec succès un axe avec une hiérarchie imbriquée', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer une hiérarchie: parent -> enfant -> petit-enfant
      const parentAxe = await caller.plans.axes.create({
        nom: 'Axe parent hiérarchie',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const childAxe = await caller.plans.axes.create({
        nom: 'Axe enfant',
        collectiviteId: collectivite.id,
        planId,
        parent: parentAxe.id,
      });

      const grandchildAxe1 = await caller.plans.axes.create({
        nom: 'Petit-enfant 1',
        collectiviteId: collectivite.id,
        planId,
        parent: childAxe.id,
      });

      const grandchildAxe2 = await caller.plans.axes.create({
        nom: 'Petit-enfant 2',
        collectiviteId: collectivite.id,
        planId,
        parent: childAxe.id,
      });

      // Vérifier que tous les axes existent avant suppression
      const parentBefore = await caller.plans.axes.get({ axeId: parentAxe.id });
      expect(parentBefore).toBeDefined();

      const childBefore = await caller.plans.axes.get({ axeId: childAxe.id });
      expect(childBefore).toBeDefined();

      const grandchild1Before = await caller.plans.axes.get({
        axeId: grandchildAxe1.id,
      });
      expect(grandchild1Before).toBeDefined();

      const grandchild2Before = await caller.plans.axes.get({
        axeId: grandchildAxe2.id,
      });
      expect(grandchild2Before).toBeDefined();

      // Supprimer l'axe parent (devrait supprimer récursivement toute la hiérarchie)
      await caller.plans.axes.delete({ axeId: parentAxe.id });

      // Vérifier que tous les axes ont été supprimés
      await expect(
        caller.plans.axes.get({ axeId: parentAxe.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");

      await expect(
        caller.plans.axes.get({ axeId: childAxe.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");

      await expect(
        caller.plans.axes.get({ axeId: grandchildAxe1.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");

      await expect(
        caller.plans.axes.get({ axeId: grandchildAxe2.id })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");
    });

    test("Supprimer avec succès un axe et vérifier qu'il est retiré de la liste", async () => {
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
        // Nettoyer les axes restants si nécessaire
        await db.db.delete(axeTable).where(eq(axeTable.plan, planId));
      });

      // Vérifier que tous les axes sont dans la liste
      const listBefore = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
      });
      const axeIdsBefore = listBefore.axes.map((a) => a.id);
      expect(axeIdsBefore).toContain(axe1.id);
      expect(axeIdsBefore).toContain(axe2.id);
      expect(axeIdsBefore).toContain(axe3.id);

      // Supprimer un axe
      await caller.plans.axes.delete({ axeId: axe2.id });

      // Vérifier que l'axe supprimé n'est plus dans la liste
      const listAfter = await caller.plans.axes.list({
        parentId: planId,
        collectiviteId: collectivite.id,
      });
      const axeIdsAfter = listAfter.axes.map((a) => a.id);
      expect(axeIdsAfter).not.toContain(axe2.id);
      expect(axeIdsAfter).toContain(axe1.id);
      expect(axeIdsAfter).toContain(axe3.id);
    });

    test('Supprimer avec succès un axe supprime les indicateurs qui lui sont rattachés', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer des indicateurs de test
      const indicateur1Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur 1 pour suppression',
        unite: 'kg',
      });

      const indicateur2Id = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Indicateur 2 pour suppression',
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
        nom: 'Axe avec indicateurs à supprimer',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
        indicateurs: [{ id: indicateur1Id }, { id: indicateur2Id }],
      });
      const axeId = createdAxe.id;

      // Vérifier que les indicateurs sont associés à l'axe avant suppression
      const axeIndicateursBefore = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));

      expect(axeIndicateursBefore).toHaveLength(2);
      expect(axeIndicateursBefore.map((ai) => ai.indicateurId)).toEqual(
        expect.arrayContaining([indicateur1Id, indicateur2Id])
      );

      // Supprimer l'axe
      await caller.plans.axes.delete({ axeId });

      // Vérifier que les liens entre l'axe et les indicateurs ont été supprimés
      const axeIndicateursAfter = await db.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.axeId, axeId));

      expect(axeIndicateursAfter).toHaveLength(0);
    });
  });

  describe("Supprimer un axe - Cas d'erreur", () => {
    test('Impossible de supprimer un axe inexistant', async () => {
      const caller = router.createCaller({ user: editorUser });

      const nonExistentAxeId = 999999;

      await expect(
        caller.plans.axes.delete({ axeId: nonExistentAxeId })
      ).rejects.toThrow("L'axe demandé n'a pas été trouvé");
    });

    test('Un utilisateur sans droits sur la collectivité ne peut pas supprimer un axe', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe avec l'utilisateur admin
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe pour test permissions',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Utilisateur sans droits
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const unauthorizedCaller = router.createCaller({ user: yoloDodoUser });

      await expect(
        unauthorizedCaller.plans.axes.delete({ axeId: createdAxe.id })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('Un utilisateur avec des droits de lecture sur la collectivité ne peut pas supprimer un axe', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe avec l'utilisateur admin
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe pour test lecture',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Utilisateur avec droits de lecture uniquement
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteRole.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const lectureCaller = router.createCaller({ user: lectureUser });

      await expect(
        lectureCaller.plans.axes.delete({ axeId: createdAxe.id })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test("Un utilisateur avec des droits d'édition limités sur la collectivité ne peut pas supprimer un axe", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe avec l'utilisateur admin
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe pour test édition limitée',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Utilisateur avec droits d'édition limités
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromDcp(user);
      const limitedEditionCaller = router.createCaller({
        user: limitedEditionUser,
      });

      await expect(
        limitedEditionCaller.plans.axes.delete({ axeId: createdAxe.id })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });

  describe('Supprimer un axe - Cas limites', () => {
    test("La suppression d'un axe n'affecte pas les axes frères", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer plusieurs axes frères
      const axe1 = await caller.plans.axes.create({
        nom: 'Axe frère 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axe2 = await caller.plans.axes.create({
        nom: 'Axe frère 2',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const axe3 = await caller.plans.axes.create({
        nom: 'Axe frère 3',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      // Vérifier que tous les axes existent
      const axe1Before = await caller.plans.axes.get({ axeId: axe1.id });
      expect(axe1Before).toBeDefined();

      const axe2Before = await caller.plans.axes.get({ axeId: axe2.id });
      expect(axe2Before).toBeDefined();

      const axe3Before = await caller.plans.axes.get({ axeId: axe3.id });
      expect(axe3Before).toBeDefined();

      // Supprimer seulement axe2
      await caller.plans.axes.delete({ axeId: axe2.id });

      // Vérifier que axe2 est supprimé mais axe1 et axe3 existent toujours
      await expect(caller.plans.axes.get({ axeId: axe2.id })).rejects.toThrow(
        "L'axe demandé n'a pas été trouvé"
      );

      const axe1After = await caller.plans.axes.get({ axeId: axe1.id });
      expect(axe1After).toBeDefined();
      expect(axe1After.id).toBe(axe1.id);

      const axe3After = await caller.plans.axes.get({ axeId: axe3.id });
      expect(axe3After).toBeDefined();
      expect(axe3After.id).toBe(axe3.id);
    });

    test("La suppression d'un axe avec plusieurs niveaux d'enfants supprime tous les descendants", async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer une hiérarchie complexe
      const level1 = await caller.plans.axes.create({
        nom: 'Niveau 1',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });

      const level2a = await caller.plans.axes.create({
        nom: 'Niveau 2a',
        collectiviteId: collectivite.id,
        planId,
        parent: level1.id,
      });

      const level2b = await caller.plans.axes.create({
        nom: 'Niveau 2b',
        collectiviteId: collectivite.id,
        planId,
        parent: level1.id,
      });

      const level3a = await caller.plans.axes.create({
        nom: 'Niveau 3a',
        collectiviteId: collectivite.id,
        planId,
        parent: level2a.id,
      });

      const level3b = await caller.plans.axes.create({
        nom: 'Niveau 3b',
        collectiviteId: collectivite.id,
        planId,
        parent: level2a.id,
      });

      const level4 = await caller.plans.axes.create({
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

      // Supprimer level1 (devrait supprimer toute la hiérarchie)
      await caller.plans.axes.delete({ axeId: level1.id });

      // Vérifier que tous les axes ont été supprimés
      for (const axeId of allAxes) {
        await expect(caller.plans.axes.get({ axeId })).rejects.toThrow(
          "L'axe demandé n'a pas été trouvé"
        );
      }
    });
  });
});
