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
import { CollectiviteAccessLevelEnum } from '@tet/domain/users';
import { onTestFinished } from 'vitest';

describe('Upsert Axe', () => {
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

  describe('Upsert Axe - Success Cases', () => {
    test('Successfully create an axe', async () => {
      const caller = router.createCaller({ user: editorUser });

      const axeInput = {
        nom: 'Axe à créer',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      };

      const createdAxe = await caller.plans.axes.create(axeInput);
      const axeId = createdAxe.id;
      expect(axeId).toBeDefined();

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      const plan = await caller.plans.plans.get({ planId });

      expect(plan.axes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: axeId,
            nom: axeInput.nom,
            parent: planId,
          }),
        ])
      );
    });

    test('Successfully update an axe', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Créer un axe
      const createdAxe = await caller.plans.axes.create({
        nom: 'Axe à modifier',
        collectiviteId: collectivite.id,
        planId,
        parent: planId,
      });
      const axeId = createdAxe.id;

      onTestFinished(async () => {
        const cleanupCaller = router.createCaller({ user: editorUser });
        await cleanupCaller.plans.axes.delete({ axeId });
      });

      // Modifier l'axe
      const updatedAxe = await caller.plans.axes.update({
        id: axeId,
        nom: 'Axe modifié',
        collectiviteId: collectivite.id,
      });

      expect(updatedAxe).toEqual(
        expect.objectContaining({
          id: axeId,
          nom: 'Axe modifié',
          collectiviteId: collectivite.id,
          parent: planId,
        })
      );
    });
  });

  describe('Upsert Axe - Access Rights', () => {
    test('User without rights on collectivite cannot create axe', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.plans.axes.create({
          nom: 'Axe non autorisé',
          collectiviteId: collectivite.id,
          planId,
          parent: planId,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('User with lecture rights on collectivite cannot create axe', async () => {
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
        caller.plans.axes.create({
          nom: 'Axe non autorisé',
          collectiviteId: collectivite.id,
          planId,
          parent: planId,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });

    test('User with limited edition rights on collectivite cannot create axe', async () => {
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
        caller.plans.axes.create({
          nom: 'Axe non autorisé',
          collectiviteId: collectivite.id,
          planId,
          parent: planId,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });
});
