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

describe('Create Plan', () => {
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

  describe('Create Plan - Success Cases', () => {
    test('Successfully create a plan', async () => {
      const caller = router.createCaller({ user: editorUser });

      const planInput = {
        nom: 'Plan à créer',
        collectiviteId: collectivite.id,
      };

      const planId = await caller.plans.plans.create(planInput);

      onTestFinished(async () => {
        await caller.plans.plans.deletePlan({ planId: planId.id });
      });

      const plan = await caller.plans.plans.get({ planId: planId.id });

      expect(plan).toEqual(
        expect.objectContaining({
          id: planId.id,
          nom: planInput.nom,
          collectiviteId: collectivite.id,
        })
      );
    });
  });

  describe('Create Plan - Access Rights', () => {
    test('User without rights on collectivite cannot create plan', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.plans.plans.create({
          nom: 'Plan non autorisé',
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('User with lecture rights on collectivite cannot create plan', async () => {
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
        caller.plans.plans.create({
          nom: 'Plan non autorisé',
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('User with limited edition rights on collectivite cannot create plan', async () => {
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
        caller.plans.plans.create({
          nom: 'Plan non autorisé',
          collectiviteId: collectivite.id,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });
});
