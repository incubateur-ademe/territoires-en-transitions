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
import {
  Collectivite,
  getReferentielDisplayMap,
} from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { cleanupReferentielActionStatutsAndLabellisations } from '../update-action-statut/referentiel-action-statut.test-fixture';
import { seedCollectiviteReferentielDisplayActivity } from './reset-display-preferences.test-fixture';

describe('ResetDisplayPreferencesRouter', () => {
  let router: TrpcRouter;
  let authUser: AuthenticatedUser;
  let app: INestApplication;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    authUser = await getAuthUser();
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
    expect(getReferentielDisplayMap(result.referentiels)).toEqual({
      cae: false,
      eci: false,
      te: true,
    });
    expect(result.referentiels).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
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
    expect(getReferentielDisplayMap(result.referentiels)).toEqual({
      cae: false,
      eci: false,
      te: true,
    });
    expect(result.referentiels).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  test('CAE is displayed when collectivite has enough CAE activity and support user resets display preferences', async () => {
    const editorUserCaller = router.createCaller({ user: editorUser });
    const trpcClient = createTRPCClientFromCaller(editorUserCaller);
    await seedCollectiviteReferentielDisplayActivity({
      trpcClient,
      collectiviteId: collectivite.id,
      referentiel: ReferentielIdEnum.CAE,
    });
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
    expect(getReferentielDisplayMap(result.referentiels)).toEqual({
      cae: true,
      eci: false,
      te: true,
    });
    expect(result.referentiels).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });
  });

  test('ECI is displayed when collectivite has enough ECI activity and support user resets display preferences', async () => {
    const editorUserCaller = router.createCaller({ user: editorUser });
    const trpcClient = createTRPCClientFromCaller(editorUserCaller);
    await seedCollectiviteReferentielDisplayActivity({
      trpcClient,
      collectiviteId: collectivite.id,
      referentiel: ReferentielIdEnum.ECI,
    });
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
    expect(getReferentielDisplayMap(result.referentiels)).toEqual({
      cae: false,
      eci: true,
      te: true,
    });
    expect(result.referentiels).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  test('Reset is a no-op when te.populatedFromCaeEci is already set', async () => {
    const { collectivite: isolatedCollectivite, cleanup: collectiviteCleanup } =
      await addTestCollectiviteAndUser(databaseService);
    onTestFinished(collectiviteCleanup);

    const caller = router.createCaller({ user: authUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authUser.id,
    });
    onTestFinished(cleanup);

    const postSwitchPreferences = {
      cae: { display: false, mode: 'archived' as const },
      eci: { display: false, mode: 'archived' as const },
      te: {
        display: true,
        mode: 'write' as const,
        populatedFromCaeEci: {
          populatedAt: '2026-06-01T00:00:00.000Z',
          populatedBy: authUser.id,
        },
      },
    };

    await caller.collectivites.preferences.update({
      collectiviteId: isolatedCollectivite.id,
      preferences: { referentiels: postSwitchPreferences },
    });

    const result =
      await caller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        {
          collectiviteId: isolatedCollectivite.id,
        }
      );

    expect(result.referentiels).toEqual(postSwitchPreferences);
  });

  test('Non-support user cannot reset collectivite referentiels display preferences', async () => {
    const caller = router.createCaller({ user: editorUser });
    await expect(
      caller.referentiels.preferences.resetCollectiviteDisplayPreferences({
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrow('Droits insuffisants');
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
    ).rejects.toThrow('Not service role');
  });
});
