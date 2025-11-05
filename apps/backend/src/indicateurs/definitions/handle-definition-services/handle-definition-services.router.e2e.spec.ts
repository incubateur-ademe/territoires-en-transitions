import {
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { addTestUser } from '@/backend/users/users/users.fixture';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { CollectiviteAccessLevelEnum } from '@/domain/users';
import { describe, expect } from 'vitest';
import { createIndicateurPerso } from '../definitions.test-fixture';

const collectiviteId = 2;

describe('IndicateurDefinitionServiceRouter', () => {
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;
  let db: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    db = await getTestDatabase(app);
    router = app.get(TrpcRouter);

    yoloDodo = await getAuthUser(YOLO_DODO);

    return async () => {
      await app.close();
    };
  });

  test('list, update, delete services associated with an indicateur and a collectivite', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    const {
      data: [indicateurBefore],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurBefore.services).toHaveLength(0);

    // Check with new array of services

    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        services: [{ id: 2 }, { id: 3 }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurAfter.services).toHaveLength(2);
    expect(indicateurAfter.services).toContainEqual(
      expect.objectContaining({ id: 2 })
    );
    expect(indicateurAfter.services).toContainEqual(
      expect.objectContaining({ id: 3 })
    );

    // Keep only one service

    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        services: [{ id: 3 }],
      },
    });

    const {
      data: [indicateurFinal],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurFinal.services).toHaveLength(1);
    expect(indicateurFinal.services).toContainEqual(
      expect.objectContaining({ id: 3 })
    );
  });

  test('verify modified fields are updated', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    const {
      data: [indicateurBefore],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        services: [{ id: 2 }, { id: 3 }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurAfter.modifiedBy?.id).toEqual(yoloDodo.id);
    expect(new Date(indicateurAfter.modifiedAt).getTime()).toBeGreaterThan(
      new Date(indicateurBefore.modifiedAt).getTime()
    );
  });

  test('User with lecture rights on collectivite cannot update/delete services', async () => {
    const caller = router.createCaller({ user: yoloDodo });
    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    const { user, cleanup } = await addTestUser(db, {
      collectiviteId: collectiviteId,
      accessLevel: CollectiviteAccessLevelEnum.LECTURE,
    });
    onTestFinished(async () => {
      await cleanup();
    });

    const lectureUser = getAuthUserFromDcp(user);
    const lectureCaller = router.createCaller({ user: lectureUser });

    await expect(() =>
      lectureCaller.indicateurs.definitions.update({
        indicateurId,
        collectiviteId: collectiviteId,
        indicateurFields: {
          services: [{ id: 3 }],
        },
      })
    ).rejects.toThrowError(/Droits insuffisants/);

    await expect(() =>
      lectureCaller.indicateurs.definitions.delete({
        indicateurId,
        collectiviteId: collectiviteId,
      })
    ).rejects.toThrowError(/Droits insuffisants/);
  });

  test('User with limited edition rights on collectivite cannot update/delete services', async () => {
    const adminCaller = router.createCaller({ user: yoloDodo });
    const indicateurId = await createIndicateurPerso({
      caller: adminCaller,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    const { user, cleanup } = await addTestUser(db, {
      collectiviteId: collectiviteId,
      accessLevel: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
    });
    onTestFinished(async () => {
      await cleanup();
    });

    const limitedEditionUser = getAuthUserFromDcp(user);
    const limitedEditionCaller = router.createCaller({
      user: limitedEditionUser,
    });

    await expect(() =>
      limitedEditionCaller.indicateurs.definitions.update({
        indicateurId,
        collectiviteId: collectiviteId,
        indicateurFields: {
          services: [{ id: 3 }],
        },
      })
    ).rejects.toThrowError(/Droits insuffisants/);

    await expect(() =>
      limitedEditionCaller.indicateurs.definitions.delete({
        indicateurId,
        collectiviteId: collectiviteId,
      })
    ).rejects.toThrowError(/Droits insuffisants/);

    // Now we update the indicateur with a pilote of the limited edition user
    await adminCaller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId: collectiviteId,
      indicateurFields: {
        pilotes: [{ userId: limitedEditionUser.id }],
      },
    });

    // The limited edition user should be able to update the indicateur
    await limitedEditionCaller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId: collectiviteId,
      indicateurFields: {
        services: [{ id: 3 }],
      },
    });

    // But still not able to delete the indicateur
    await expect(() =>
      limitedEditionCaller.indicateurs.definitions.delete({
        indicateurId,
        collectiviteId: collectiviteId,
      })
    ).rejects.toThrowError(/Droits insuffisants/);

    // Remove the pilote to be able to delete the user
    await adminCaller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId: collectiviteId,
      indicateurFields: {
        pilotes: [],
      },
    });
  });

  test('cannot upsert services of another collectivite', async () => {
    const callerYoloDodo = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller: callerYoloDodo,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    await expect(() =>
      callerYoloDodo.indicateurs.definitions.update({
        indicateurId,
        collectiviteId: 100,
        indicateurFields: {
          services: [{ id: 2 }, { id: 3 }],
        },
      })
    ).rejects.toThrowError(/Droits insuffisants/);
  });
});
