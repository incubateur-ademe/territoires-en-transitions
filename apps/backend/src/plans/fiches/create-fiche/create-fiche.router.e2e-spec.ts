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

describe('Create Fiche Action', () => {
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
    });

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromDcp(testCollectiviteAndUserResult.user);

    return async () => {
      await testCollectiviteAndUserResult.cleanup();
    };
  });

  describe('Create Fiche Action - Success Cases', () => {
    test('Successfully create a fiche action', async () => {
      const caller = router.createCaller({ user: editorUser });

      const ficheInput = {
        titre: 'Fiche à créer',
        collectiviteId: collectivite.id,
      };

      const createdFiche = await caller.plans.fiches.create({
        fiche: ficheInput,
      });
      const ficheId = createdFiche.id;
      assert(ficheId);

      onTestFinished(async () => {
        await caller.plans.fiches.delete({ ficheId, deleteMode: 'hard' });
      });

      const fiche = await caller.plans.fiches.get({ id: ficheId });

      expect(fiche).toEqual(
        expect.objectContaining({
          id: ficheId,
          titre: ficheInput.titre,
          collectiviteId: collectivite.id,
        })
      );
    });
  });

  describe('Create Fiche Action - Access Rights', () => {
    test('User without rights on collectivite cannot create fiche', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.plans.fiches.create({
          fiche: {
            titre: 'Fiche non autorisée',
            collectiviteId: collectivite.id,
          },
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${YOLO_DODO.id} n'a pas l'autorisation plans.fiches.create sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('User with lecture rights on collectivite cannot create fiche', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      await expect(
        caller.plans.fiches.create({
          fiche: {
            titre: 'Fiche non autorisée',
            collectiviteId: collectivite.id,
          },
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.userId} n'a pas l'autorisation plans.fiches.create sur la ressource Collectivité ${collectivite.id}`
      );
    });

    test('User with limited edition rights on collectivite cannot create fiche', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const limitedEditionUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: limitedEditionUser });

      await expect(
        caller.plans.fiches.create({
          fiche: {
            titre: 'Fiche non autorisée',
            collectiviteId: collectivite.id,
          },
        })
      ).rejects.toThrow(
        `Droits insuffisants, l'utilisateur ${user.userId} n'a pas l'autorisation plans.fiches.create sur la ressource Collectivité ${collectivite.id}`
      );
    });
  });
});
