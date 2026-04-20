import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
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
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let cleanupBeforeAll: (() => Promise<void>) | undefined;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let noAccessUser: AuthenticatedUser;
  let testFicheId: number;

  beforeAll(async () => {
    app = await getTestApp();
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

    const noAccessUserResult = await addTestUser(db);
    noAccessUser = getAuthUserFromUserCredentials(noAccessUserResult.user);

    const caller = router.createCaller({ user: editorUser });
    const createFicheResult = await createFicheAndCleanupFunction({
      caller,
      ficheInput: {
        titre: 'Fiche à supprimer',
        collectiviteId: collectivite.id,
      },
    });
    testFicheId = createFicheResult.ficheId;

    cleanupBeforeAll = async () => {
      await createFicheResult.ficheCleanup();
      await noAccessUserResult.cleanup();
      await testCollectiviteAndUserResult.cleanup();
    };
  });

  afterAll(async () => {
    await cleanupBeforeAll?.();
    await app.close();
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
      const caller = router.createCaller({ user: noAccessUser });

      // Attempt to delete should fail with ForbiddenException
      await expect(
        caller.plans.fiches.delete({ ficheId: testFicheId })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${noAccessUser.id} n'a pas l'autorisation plans.fiches.delete sur la ressource Collectivité ${collectivite.id}`
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
  });
});
