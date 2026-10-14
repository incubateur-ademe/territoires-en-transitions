import { INestApplication } from '@nestjs/common';
import {
  getAuthUser,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addAndEnableUserSuperAdminMode } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  Collectivite,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { addTestCollectiviteAndUser } from '../collectivites/collectivites.test-fixture';
import { CollectivitePreferencesRepository } from './collectivite-preferences.repository';

const populatedFromCaeEci = {
  populatedAt: '2026-06-01T00:00:00.000Z',
  populatedBy: 'user-id',
};

const referentielsWithCaeHidden = {
  ...defaultCollectivitePreferences.referentiels,
  cae: { display: false, mode: 'archived' as const },
};

describe('CollectivitePreferencesRouter', () => {
  let router: TrpcRouter;
  let authUser: AuthenticatedUser;
  let app: INestApplication;
  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    router = await getTestRouter();
    authUser = await getAuthUser();
    app = await getTestApp();
    databaseService = await getTestDatabase(app);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.EDITION,
        },
      }
    );

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUserResult.user
    );
  });

  afterAll(async () => {
    await app.close();
  });

  test('Non-support user cannot update preferences', async () => {
    const caller = router.createCaller({ user: editorUser });
    await expect(
      caller.collectivites.preferences.update({
        collectiviteId: collectivite.id,
        preferences: { referentiels: referentielsWithCaeHidden },
      })
    ).rejects.toThrowError('Droits insuffisants');
  });

  test('Support user can update preferences', async () => {
    const caller = router.createCaller({ user: authUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authUser.id,
    });
    onTestFinished(cleanup);

    const updated = await caller.collectivites.preferences.update({
      collectiviteId: collectivite.id,
      preferences: { referentiels: referentielsWithCaeHidden },
    });

    expect(updated.referentiels).toEqual(referentielsWithCaeHidden);
  });

  test('Support user can set any mode and display combination', async () => {
    const caller = router.createCaller({ user: authUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authUser.id,
    });
    onTestFinished(cleanup);

    const referentiels = {
      cae: { display: false, mode: 'write' as const },
      eci: { display: true, mode: 'readonly' as const },
      te: { display: true, mode: 'archived' as const },
    };

    const updated = await caller.collectivites.preferences.update({
      collectiviteId: collectivite.id,
      preferences: { referentiels },
    });

    expect(updated.referentiels).toEqual(referentiels);
  });

  test('Update never sets populatedFromCaeEci on a collectivité that has not switched', async () => {
    const { collectivite: isolatedCollectivite, cleanup: cleanupCollectivite } =
      await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanupCollectivite);

    const caller = router.createCaller({ user: authUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authUser.id,
    });
    onTestFinished(cleanup);

    const updated = await caller.collectivites.preferences.update({
      collectiviteId: isolatedCollectivite.id,
      preferences: {
        referentiels: {
          ...defaultCollectivitePreferences.referentiels,
          te: { display: true, mode: 'write' },
        },
      },
    });

    expect(updated.referentiels.te).toEqual({ display: true, mode: 'write' });
  });

  test('Update keeps populatedFromCaeEci of a switched collectivité untouched', async () => {
    const { collectivite: isolatedCollectivite, cleanup: cleanupCollectivite } =
      await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanupCollectivite);

    // seule la bascule pose le marqueur : on la simule via le repository
    await app
      .get(CollectivitePreferencesRepository)
      .updatePreferences(isolatedCollectivite.id, {
        referentiels: {
          cae: { display: true, mode: 'archived' },
          eci: { display: false, mode: 'archived' },
          te: { display: true, mode: 'write', populatedFromCaeEci },
        },
      });

    const caller = router.createCaller({ user: authUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authUser.id,
    });
    onTestFinished(cleanup);

    // le marqueur est omis
    const withoutMarker = await caller.collectivites.preferences.update({
      collectiviteId: isolatedCollectivite.id,
      preferences: {
        referentiels: {
          cae: { display: true, mode: 'write' },
          eci: { display: false, mode: 'archived' },
          te: { display: false, mode: 'readonly' },
        },
      },
    });
    expect(withoutMarker.referentiels).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: false, mode: 'readonly', populatedFromCaeEci },
    });

    // un marqueur différent est ignoré
    const withOtherMarker = await caller.collectivites.preferences.update({
      collectiviteId: isolatedCollectivite.id,
      preferences: {
        referentiels: {
          ...withoutMarker.referentiels,
          te: {
            display: true,
            mode: 'write',
          },
        },
      },
    });
    expect(withOtherMarker.referentiels.te).toEqual({
      display: true,
      mode: 'write',
      populatedFromCaeEci,
    });
  });
});
