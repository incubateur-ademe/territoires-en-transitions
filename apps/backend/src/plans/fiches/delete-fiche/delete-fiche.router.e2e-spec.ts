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
import { createFicheAndCleanupFunction } from '../fiches.test-fixture';

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
        accessLevel: CollectiviteAccessLevelEnum.ADMIN,
      },
    });
    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromDcp(testCollectiviteAndUserResult.user);

    const caller = router.createCaller({ user: editorUser });
    const createFicheResult = await createFicheAndCleanupFunction({
      caller: caller,
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
    test('Successfully delete a fiche action', async () => {
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
      });

      // Verify the result
      expect(result).toEqual({ success: true });

      // Verify fiche no longer exists in database
      await expect(
        caller.plans.fiches.get({ id: anotherFicheId })
      ).rejects.toThrow(
        `Aucune fiche action trouvée avec l'id ${anotherFicheId}`
      );
    });
  });

  describe('Delete Fiche Action - Error Cases', () => {
    test('Throw NotFoundException when trying to delete a non-existing fiche', async () => {
      const caller = router.createCaller({ user: editorUser });
      const nonExistingFicheId = -1;

      await expect(
        caller.plans.fiches.delete({ ficheId: nonExistingFicheId })
      ).rejects.toThrow(
        `Fiche action non trouvée pour l'id ${nonExistingFicheId}`
      );
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
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      // Attempt to delete should fail with ForbiddenException
      await expect(
        caller.plans.fiches.delete({ ficheId: testFicheId })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.userId} n'a pas l'autorisation plans.fiches.delete sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('User with limited edition rights on collectivite cannot delete fiche', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      // Attempt to delete should fail with ForbiddenException
      await expect(
        caller.plans.fiches.delete({ ficheId: testFicheId })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.userId} n'a pas l'autorisation plans.fiches.delete sur la ressource Collectivité ${collectivite.id}`
      );
    });
  });
});
