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

describe('CollectivitePreferencesRouter', () => {
  let router: TrpcRouter;
  let authUser: AuthenticatedUser;
  let app: INestApplication;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;

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

    return async () => {
      await testCollectiviteAndUserResult.cleanup();
      if (app) {
        await app.close();
      }
    };
  });

  test('Non-support user cannot update preferences', async () => {
    const caller = router.createCaller({ user: editorUser });
    await expect(
      caller.collectivites.preferences.update({
        collectiviteId: collectivite.id,
        preferences: {
          referentiels: {
            display: {
              ...defaultCollectivitePreferences.referentiels.display,
              cae: false,
            },
          },
        },
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
      preferences: {
        referentiels: {
          display: {
            cae: false,
            eci: true,
            te: true,
          },
        },
      },
    });
    expect(updated.referentiels.display.cae).toBe(false);
    expect(updated.referentiels.display.eci).toBe(true);
    expect(updated.referentiels.display.te).toBe(true);
  });
});
