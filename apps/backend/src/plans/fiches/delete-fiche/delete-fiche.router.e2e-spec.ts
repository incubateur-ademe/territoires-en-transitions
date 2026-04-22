import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
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
import { eq, inArray } from 'drizzle-orm';
import { createFicheAndCleanupFunction } from '../fiches.test-fixture';
import { ficheActionTable } from '../shared/models/fiche-action.table';

describe('Delete Fiche Action', () => {
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let testFicheId: number;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);
    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
      user: {
        role: CollectiviteRole.ADMIN,
      },
    });
    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUserResult.user
    );

    const caller = router.createCaller({ user: editorUser });
    const createFicheResult = await createFicheAndCleanupFunction({
      caller,
      ficheInput: {
        titre: 'Fiche à supprimer',
        collectiviteId: collectivite.id,
      },
    });
    testFicheId = createFicheResult.ficheId;

    return async () => {
      await createFicheResult.ficheCleanup();
      await testCollectiviteAndUserResult.cleanup();
    };
  });

  describe('Delete Fiche Action - Success Cases', () => {
    test('Successfully delete a fiche action (soft delete)', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Delete the fiche
      const result = await caller.plans.fiches.delete({
        ficheId: testFicheId,
      });

      // Verify the result
      expect(result).toEqual({ success: true });

      // Verify fiche is no longer returned by the get() method
      await expect(
        caller.plans.fiches.get({ id: testFicheId })
      ).rejects.toThrow(`Aucune action trouvée avec l'id ${testFicheId}`);

      // Verify fiche still exists in database but with the "deleted" flag
      const [row1] = await db.db
        .select({ id: ficheActionTable.id, deleted: ficheActionTable.deleted })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
      expect(row1.deleted).toBe(true);
    });

    test('Successfully delete a fiche and sub-fiche (soft delete)', async () => {
      const caller = router.createCaller({ user: editorUser });

      // add sub-fiche
      const { ficheId: childFicheId } = await createFicheAndCleanupFunction({
        caller,
        ficheInput: {
          titre: 'Sous-fiche à supprimer 1',
          collectiviteId: collectivite.id,
          parentId: testFicheId,
        },
      });

      // Delete the fiche
      const result = await caller.plans.fiches.delete({
        ficheId: testFicheId,
      });

      // Verify the result
      expect(result).toEqual({ success: true });

      // Verify fiche and sub-fiche still exists in database but with the "deleted" flag
      const [row1, row2] = await db.db
        .select({ id: ficheActionTable.id, deleted: ficheActionTable.deleted })
        .from(ficheActionTable)
        .where(inArray(ficheActionTable.id, [testFicheId, childFicheId]));
      expect(row1.deleted).toBe(true);
      expect(row2.deleted).toBe(true);
    });

    test('Successfully delete a fiche action (hard delete)', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Create another fiche
      const { ficheId: anotherFicheId } = await createFicheAndCleanupFunction({
        caller,
        ficheInput: {
          titre: 'Fiche à supprimer 2',
          collectiviteId: collectivite.id,
        },
      });

      // Delete the fiche
      const result = await caller.plans.fiches.delete({
        ficheId: anotherFicheId,
        deleteMode: 'hard',
      });

      // Verify the result
      expect(result).toEqual({ success: true });

      // Verify fiche no longer exists in database
      await expect(
        caller.plans.fiches.get({ id: anotherFicheId })
      ).rejects.toThrow(`Aucune action trouvée avec l'id ${anotherFicheId}`);
    });

    test('Successfully delete a fiche and sub-fiche (hard delete)', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Create another fiche
      const { ficheId: anotherFicheId } = await createFicheAndCleanupFunction({
        caller,
        ficheInput: {
          titre: 'Fiche à supprimer 2',
          collectiviteId: collectivite.id,
        },
      });

      // add sub-fiche
      const { ficheId: childFicheId } = await createFicheAndCleanupFunction({
        caller,
        ficheInput: {
          titre: 'Sous-fiche à supprimer 1',
          collectiviteId: collectivite.id,
          parentId: anotherFicheId,
        },
      });

      // Delete the fiche
      const result = await caller.plans.fiches.delete({
        ficheId: anotherFicheId,
        deleteMode: 'hard',
      });

      // Verify the result
      expect(result).toEqual({ success: true });

      // Verify fiche and sub-fiche still exists in database but with the "deleted" flag
      const rows = await db.db
        .select({ id: ficheActionTable.id, deleted: ficheActionTable.deleted })
        .from(ficheActionTable)
        .where(inArray(ficheActionTable.id, [anotherFicheId, childFicheId]));
      expect(rows.length).toEqual(0);
    });
  });

  describe('Delete Fiche Action - Error Cases', () => {
    test('Throw NotFoundException when trying to delete a non-existing fiche', async () => {
      const caller = router.createCaller({ user: editorUser });
      const nonExistingFicheId = -1;

      await expect(
        caller.plans.fiches.delete({ ficheId: nonExistingFicheId })
      ).rejects.toThrow(`Action non trouvée pour l'id ${nonExistingFicheId}`);
    });
  });

  describe('Delete Fiche Action - Access Rights', () => {
    test('User without rights on collectivite cannot delete fiche', async () => {
      // Yolo Dodo has no rights on the collectivite
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      // Attempt to delete should fail with ForbiddenException
      await expect(
        caller.plans.fiches.delete({ ficheId: testFicheId })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${YOLO_DODO.id} n'a pas l'autorisation plans.fiches.delete sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('User with lecture rights on collectivite cannot delete fiche', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromUserCredentials(user);
      const caller = router.createCaller({ user: lectureUser });

      // Attempt to delete should fail with ForbiddenException
      await expect(
        caller.plans.fiches.delete({ ficheId: testFicheId })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation plans.fiches.delete sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('User with limited edition rights on collectivite cannot delete fiche', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromUserCredentials(user);
      const caller = router.createCaller({ user: lectureUser });

      // Attempt to delete should fail with ForbiddenException
      await expect(
        caller.plans.fiches.delete({ ficheId: testFicheId })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation plans.fiches.delete sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('Contributeur pilote of a parent fiche can delete its sous-action', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      const editorCaller = router.createCaller({ user: editorUser });

      // Crée une fiche parente et une sous-action rattachée à cette parente.
      const parentFiche = await editorCaller.plans.fiches.create({
        fiche: {
          titre: 'Fiche parente pilotée par le contributeur (delete)',
          collectiviteId: collectivite.id,
        },
      });
      const parentFicheId = parentFiche.id;
      assert(parentFicheId);

      const sousAction = await editorCaller.plans.fiches.create({
        fiche: {
          titre: 'Sous-action à supprimer par le pilote parent',
          collectiviteId: collectivite.id,
          parentId: parentFicheId,
        },
      });
      const sousActionId = sousAction.id;
      expect(sousActionId).toBeDefined();

      // Fait du contributeur un pilote de la fiche parente.
      await db.db.insert(ficheActionPiloteTable).values({
        ficheId: parentFicheId,
        userId: user.id,
      });

      // Nettoyage idempotent en base pour absorber les tests qui suppriment
      // eux-mêmes la sous-action.
      onTestFinished(async () => {
        await db.db
          .delete(ficheActionTable)
          .where(inArray(ficheActionTable.id, [sousActionId, parentFicheId]));
        await cleanup();
      });

      const contributeurCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(user),
      });

      const result = await contributeurCaller.plans.fiches.delete({
        ficheId: sousActionId,
        deleteMode: 'hard',
      });
      expect(result).toEqual({ success: true });

      // La sous-action doit avoir été supprimée en base.
      const rows = await db.db
        .select({ id: ficheActionTable.id })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, sousActionId));
      expect(rows.length).toEqual(0);
    });

    test('Contributeur non-pilote cannot delete a sous-action whose parent they do not pilot', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      const editorCaller = router.createCaller({ user: editorUser });

      const { ficheId: parentFicheId, ficheCleanup: parentCleanup } =
        await createFicheAndCleanupFunction({
          caller: editorCaller,
          ficheInput: {
            titre: 'Fiche parente non pilotée par le contributeur (delete)',
            collectiviteId: collectivite.id,
          },
        });
      const { ficheId: sousActionId, ficheCleanup: sousActionCleanup } =
        await createFicheAndCleanupFunction({
          caller: editorCaller,
          ficheInput: {
            titre: 'Sous-action non supprimable par un contributeur non pilote',
            collectiviteId: collectivite.id,
            parentId: parentFicheId,
          },
        });

      onTestFinished(async () => {
        await sousActionCleanup();
        await parentCleanup();
        await cleanup();
      });

      const contributeurCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(user),
      });

      await expect(
        contributeurCaller.plans.fiches.delete({
          ficheId: sousActionId,
          deleteMode: 'hard',
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation plans.fiches.delete sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('Contributeur pilote of a fiche itself cannot delete it (only sous-actions of piloted parents)', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      });

      const editorCaller = router.createCaller({ user: editorUser });

      const { ficheId: topLevelFicheId, ficheCleanup: topLevelCleanup } =
        await createFicheAndCleanupFunction({
          caller: editorCaller,
          ficheInput: {
            titre: 'Fiche de premier niveau pilotée par le contributeur',
            collectiviteId: collectivite.id,
          },
        });

      // Contributeur est pilote de la fiche de premier niveau (pas de parent).
      await db.db.insert(ficheActionPiloteTable).values({
        ficheId: topLevelFicheId,
        userId: user.id,
      });

      onTestFinished(async () => {
        await topLevelCleanup();
        await cleanup();
      });

      const contributeurCaller = router.createCaller({
        user: getAuthUserFromUserCredentials(user),
      });

      // Le fallback parent-pilote ne s'applique qu'aux sous-actions : la
      // suppression d'une fiche racine par son pilote reste refusée.
      await expect(
        contributeurCaller.plans.fiches.delete({
          ficheId: topLevelFicheId,
          deleteMode: 'hard',
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation plans.fiches.delete sur la ressource Collectivité ${collectivite.id}`
      );
    });
  });
});
