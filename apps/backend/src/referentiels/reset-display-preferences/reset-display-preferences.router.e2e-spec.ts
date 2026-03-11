import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  createTRPCClientFromCaller,
  getAuthUser,
  getAuthUserFromUserCredentials,
  getServiceRoleUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addAndEnableUserSuperAdminMode } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import {
  cleanupReferentielActionStatutsAndLabellisations,
  updateAllNeedReferentielStatutsToCompleteReferentiel,
} from '../update-action-statut/referentiel-action-statut.test-fixture';

describe('ResetDisplayPreferencesRouter', () => {
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

  afterEach(async () => {
    await cleanupReferentielActionStatutsAndLabellisations(
      databaseService,
      collectivite.id
    );
  });

  test('Service role can reset collectivite referentiels display preferences', async () => {
    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });
    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        {
          collectiviteId: collectivite.id,
        }
      );
    expect(result.referentiels.display).toEqual({
      cae: false,
      eci: false,
      te: true,
    });
  });

  test('Support user can reset collectivite referentiels display preferences', async () => {
    const caller = router.createCaller({ user: authUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authUser.id,
    });
    onTestFinished(cleanup);

    const result =
      await caller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        {
          collectiviteId: collectivite.id,
        }
      );
    expect(result.referentiels.display).toEqual({
      cae: false,
      eci: false,
      te: true,
    });
  });

  test('ECI is displayed if it has been filled and support user resets display preferences', async () => {
    const editorUserCaller = router.createCaller({ user: editorUser });
    const trpcClient = createTRPCClientFromCaller(editorUserCaller);
    await updateAllNeedReferentielStatutsToCompleteReferentiel(
      trpcClient,
      collectivite.id,
      ReferentielIdEnum.ECI
    );
    const caller = router.createCaller({ user: authUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authUser.id,
    });
    onTestFinished(cleanup);

    const result =
      await caller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        {
          collectiviteId: collectivite.id,
        }
      );
    expect(result.referentiels.display).toEqual({
      cae: false,
      eci: true,
      te: true,
    });
  });

  test('Non-support user cannot reset collectivite referentiels display preferences', async () => {
    const caller = router.createCaller({ user: editorUser });
    await expect(
      caller.referentiels.preferences.resetCollectiviteDisplayPreferences({
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrowError('Droits insuffisants');
  });

  test('Only service role can call resetAllCollectivitesDisplayPreferences', async () => {
    const caller = router.createCaller({ user: authUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authUser.id,
    });
    onTestFinished(cleanup);

    await expect(
      caller.referentiels.preferences.resetAllCollectivitesDisplayPreferences(
        {}
      )
    ).rejects.toThrowError('Not service role');
  });
});
