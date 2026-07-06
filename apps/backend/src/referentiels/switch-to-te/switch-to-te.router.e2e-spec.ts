import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  Collectivite,
  type CollectiviteReferentielPreferences,
} from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { switchToTeTrpcErrorEntries } from './switch-to-te.errors';

describe('SwitchToTeRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let supportCaller: ReturnType<TrpcRouter['createCaller']>;
  let adminUser: AuthenticatedUser;
  let lectureUser: AuthenticatedUser;
  let collectivite: Collectivite;
  let cleanupSupportUser: () => Promise<void>;
  let cleanupSuperAdminMode: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const supportUserResult = await addTestUser(databaseService);
    cleanupSupportUser = supportUserResult.cleanup;
    const supportUser = getAuthUserFromUserCredentials(supportUserResult.user);
    supportCaller = router.createCaller({ user: supportUser });
    const superAdminMode = await addAndEnableUserSuperAdminMode({
      app,
      caller: supportCaller,
      userId: supportUser.id,
    });
    cleanupSuperAdminMode = superAdminMode.cleanup;

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          { role: CollectiviteRole.ADMIN },
          { role: CollectiviteRole.LECTURE },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    adminUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[0]
    );
    lectureUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[1]
    );
  });

  afterAll(async () => {
    await cleanupSuperAdminMode();
    await cleanupSupportUser();
    await app.close();
  });

  async function setReferentielPreferences(
    referentiels: CollectiviteReferentielPreferences
  ) {
    await supportCaller.collectivites.preferences.update({
      collectiviteId: collectivite.id,
      preferences: { referentiels },
    });
  }

  test('retourne SWITCH_NOT_IMPLEMENTED quand les guards passent (squelette)', async () => {
    await setReferentielPreferences({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });

    const adminCaller = router.createCaller({ user: adminUser });

    await expect(
      adminCaller.referentiels.switchToTe({ collectiviteId: collectivite.id })
    ).rejects.toThrow(
      switchToTeTrpcErrorEntries.SWITCH_NOT_IMPLEMENTED.message
    );
  });

  test('refuse si la bascule a déjà été effectuée', async () => {
    const switchedFixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [{ role: CollectiviteRole.ADMIN }],
    });
    onTestFinished(() => switchedFixture.cleanup());
    const switchedAdminUser = getAuthUserFromUserCredentials(
      switchedFixture.users[0]
    );

    await supportCaller.collectivites.preferences.update({
      collectiviteId: switchedFixture.collectivite.id,
      preferences: {
        referentiels: {
          cae: { display: false, mode: 'archived' },
          eci: { display: false, mode: 'archived' },
          te: {
            display: true,
            mode: 'write',
            populatedFromCaeEci: {
              populatedAt: '2026-06-01T00:00:00.000Z',
              populatedBy: switchedAdminUser.id,
            },
          },
        },
      },
    });

    const adminCaller = router.createCaller({ user: switchedAdminUser });

    await expect(
      adminCaller.referentiels.switchToTe({
        collectiviteId: switchedFixture.collectivite.id,
      })
    ).rejects.toThrow(switchToTeTrpcErrorEntries.ALREADY_SWITCHED.message);
  });

  test('refuse une CT non engagée (TE en write)', async () => {
    await setReferentielPreferences({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });

    const adminCaller = router.createCaller({ user: adminUser });

    await expect(
      adminCaller.referentiels.switchToTe({ collectiviteId: collectivite.id })
    ).rejects.toThrow(switchToTeTrpcErrorEntries.NOT_ELIGIBLE.message);
  });

  test('refuse quand TE readonly mais aucune source CAE/ECI engagée', async () => {
    await setReferentielPreferences({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });

    const adminCaller = router.createCaller({ user: adminUser });

    await expect(
      adminCaller.referentiels.switchToTe({ collectiviteId: collectivite.id })
    ).rejects.toThrow(switchToTeTrpcErrorEntries.NOT_ELIGIBLE.message);
  });

  test('refuse sans permission REFERENTIELS.MUTATE', async () => {
    await setReferentielPreferences({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });

    const lectureCaller = router.createCaller({ user: lectureUser });

    await expect(
      lectureCaller.referentiels.switchToTe({ collectiviteId: collectivite.id })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });
});
