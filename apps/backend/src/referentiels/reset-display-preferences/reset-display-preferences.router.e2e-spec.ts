import { INestApplication } from '@nestjs/common';
import {
  addTestCollectiviteAndUser,
  setCollectiviteCotStatus,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createAudit } from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
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
  collectiviteTypeEnum,
  getReferentielDisplayMap,
} from '@tet/domain/collectivites';
import {
  ReferentielIdEnum,
  StatutAvancementEnum,
  type StatutAvancementCreate,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, sql } from 'drizzle-orm';
import { actionStatutTable } from '../models/action-statut.table';
import { cleanupReferentielActionStatutsAndLabellisations } from '../update-action-statut/referentiel-action-statut.test-fixture';
import { RECENT_ACTIVITY_AGE_MS_THRESHOLD } from './compute-referentiel-display.rules';
import { ResetDisplayPreferencesService } from './reset-display-preferences.service';
import { seedCollectiviteReferentielDisplayActivity } from './reset-display-preferences.test-fixture';

describe('ResetDisplayPreferencesRouter', () => {
  let router: TrpcRouter;
  let authUser: AuthenticatedUser;
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    authUser = await getAuthUser();
    databaseService = await getTestDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const setupIsolatedCollectivite = async (
    role = CollectiviteRole.EDITION,
    collectiviteArgs?: NonNullable<
      Parameters<typeof addTestCollectiviteAndUser>[1]
    >['collectivite']
  ) => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: { role },
        collectivite: collectiviteArgs,
      }
    );

    onTestFinished(async () => {
      await cleanupReferentielActionStatutsAndLabellisations(
        databaseService,
        collectivite.id
      );
      await cleanup();
    });

    return {
      collectivite,
      user,
      authenticatedUser: getAuthUserFromUserCredentials(user),
    };
  };

  // antidate les statuts au-delà de la fenêtre d'activité récente. Le trigger
  // `update_modified_at` réécrit `modified_at` à chaque update : on le neutralise
  // le temps de la transaction
  const backdateActionStatuts = async (collectiviteId: number) => {
    const ageMs = RECENT_ACTIVITY_AGE_MS_THRESHOLD + 24 * 60 * 60 * 1000;
    await databaseService.db.transaction(async (tx) => {
      await tx.execute(sql`set local session_replication_role = 'replica'`);
      await tx
        .update(actionStatutTable)
        .set({
          modifiedAt: sql`now() - ${ageMs} * interval '1 millisecond'`,
        })
        .where(eq(actionStatutTable.collectiviteId, collectiviteId));
    });
  };

  test('Service role can reset collectivite referentiels display preferences', async () => {
    const { collectivite } = await setupIsolatedCollectivite();
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
    const { collectivite } = await setupIsolatedCollectivite();
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
    const { collectivite: isolatedCollectivite, authenticatedUser } =
      await setupIsolatedCollectivite();
    const isolatedEditorCaller = router.createCaller({
      user: authenticatedUser,
    });
    const trpcClient = createTRPCClientFromCaller(isolatedEditorCaller);
    await seedCollectiviteReferentielDisplayActivity({
      trpcClient,
      collectiviteId: isolatedCollectivite.id,
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
          collectiviteId: isolatedCollectivite.id,
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

  test('CAE stays in write without making TE readonly when its few statuts are recent', async () => {
    const { collectivite: isolatedCollectivite, authenticatedUser } =
      await setupIsolatedCollectivite();
    const trpcClient = createTRPCClientFromCaller(
      router.createCaller({ user: authenticatedUser })
    );
    await seedCollectiviteReferentielDisplayActivity({
      trpcClient,
      collectiviteId: isolatedCollectivite.id,
      referentiel: ReferentielIdEnum.CAE,
      actionStatutCount: 3,
    });

    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });
    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        {
          collectiviteId: isolatedCollectivite.id,
        }
      );
    // TE reste en écriture : la collectivité n'est pas éligible à la bascule
    expect(result.referentiels).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  test('CAE is archived but stays displayed when collectivite has only a few old CAE statuts', async () => {
    const { collectivite: isolatedCollectivite, authenticatedUser } =
      await setupIsolatedCollectivite();
    const isolatedEditorCaller = router.createCaller({
      user: authenticatedUser,
    });
    const trpcClient = createTRPCClientFromCaller(isolatedEditorCaller);
    await seedCollectiviteReferentielDisplayActivity({
      trpcClient,
      collectiviteId: isolatedCollectivite.id,
      referentiel: ReferentielIdEnum.CAE,
      actionStatutCount: 3,
    });
    await backdateActionStatuts(isolatedCollectivite.id);

    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });
    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        {
          collectiviteId: isolatedCollectivite.id,
        }
      );
    expect(result.referentiels).toEqual({
      cae: { display: true, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  const seedFewCaeStatutsThenOverwriteWith = async (
    statut: Exclude<StatutAvancementCreate, 'detaille'>
  ) => {
    const { collectivite, authenticatedUser } =
      await setupIsolatedCollectivite();
    const trpcClient = createTRPCClientFromCaller(
      router.createCaller({ user: authenticatedUser })
    );
    await seedCollectiviteReferentielDisplayActivity({
      trpcClient,
      collectiviteId: collectivite.id,
      referentiel: ReferentielIdEnum.CAE,
      actionStatutCount: 3,
    });
    const seededStatuts = await databaseService.db
      .select({ actionId: actionStatutTable.actionId })
      .from(actionStatutTable)
      .where(eq(actionStatutTable.collectiviteId, collectivite.id));
    await trpcClient.referentiels.actions.updateStatuts.mutate({
      actionStatuts: seededStatuts.map(({ actionId }) => ({
        actionId,
        statut,
        collectiviteId: collectivite.id,
      })),
    });
    return collectivite;
  };

  test('CAE is archived and hidden when all its statuts were reset to non renseigné', async () => {
    const collectivite = await seedFewCaeStatutsThenOverwriteWith(
      StatutAvancementEnum.NON_RENSEIGNE
    );

    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });
    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        { collectiviteId: collectivite.id }
      );

    expect(result.referentiels).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  test('CAE is archived but stays displayed when its only statuts are old non concerné', async () => {
    const collectivite = await seedFewCaeStatutsThenOverwriteWith(
      StatutAvancementEnum.NON_CONCERNE
    );
    await backdateActionStatuts(collectivite.id);

    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });
    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        { collectiviteId: collectivite.id }
      );

    expect(result.referentiels).toEqual({
      cae: { display: true, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  test('ECI is displayed when collectivite has enough ECI activity and support user resets display preferences', async () => {
    const { collectivite: isolatedCollectivite, authenticatedUser } =
      await setupIsolatedCollectivite();
    const isolatedEditorCaller = router.createCaller({
      user: authenticatedUser,
    });
    const trpcClient = createTRPCClientFromCaller(isolatedEditorCaller);
    await seedCollectiviteReferentielDisplayActivity({
      trpcClient,
      collectiviteId: isolatedCollectivite.id,
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
          collectiviteId: isolatedCollectivite.id,
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

  test('Syndicat keeps TE readonly and ECI write, and its empty CAE is archived', async () => {
    const { collectivite } = await setupIsolatedCollectivite(
      CollectiviteRole.EDITION,
      { natureInsee: 'SIVU' }
    );
    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });

    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        { collectiviteId: collectivite.id }
      );

    expect(result.referentiels).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  test('Syndicat keeps its CAE in write when it is engaged', async () => {
    const { collectivite, authenticatedUser } = await setupIsolatedCollectivite(
      CollectiviteRole.EDITION,
      { natureInsee: 'SIVU' }
    );
    const trpcClient = createTRPCClientFromCaller(
      router.createCaller({ user: authenticatedUser })
    );
    await seedCollectiviteReferentielDisplayActivity({
      trpcClient,
      collectiviteId: collectivite.id,
      referentiel: ReferentielIdEnum.CAE,
    });
    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });

    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        { collectiviteId: collectivite.id }
      );

    expect(result.referentiels).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  test('Nothing is archived when an active COT blocks the switch to TE', async () => {
    const { collectivite } = await setupIsolatedCollectivite();
    await setCollectiviteCotStatus(databaseService, collectivite.id, 'active');
    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });

    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        { collectiviteId: collectivite.id }
      );

    expect(result.referentiels).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  test('Nothing is archived when an audit request blocks the switch to TE', async () => {
    const { collectivite } = await setupIsolatedCollectivite();
    const { cleanup } = await createAudit({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: 'cae',
      dateDebut: null,
      valide: false,
      clos: false,
      withDemande: true,
    });
    onTestFinished(() => cleanup());
    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });

    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        { collectiviteId: collectivite.id }
      );

    expect(result.referentiels).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  test('Test collectivites are left out of the reset of all collectivites, not of a single reset', async () => {
    const { collectivite } = await setupIsolatedCollectivite();
    const { collectivite: testCollectivite } = await setupIsolatedCollectivite(
      CollectiviteRole.EDITION,
      { type: collectiviteTypeEnum.TEST }
    );

    // on ne lance pas le reset global : il réécrirait toutes les collectivités
    // de la base
    const collectiviteIds = await app
      .get(ResetDisplayPreferencesService)
      .listCollectiviteIdsToReset();
    expect(collectiviteIds).toContain(collectivite.id);
    expect(collectiviteIds).not.toContain(testCollectivite.id);

    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });
    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        { collectiviteId: testCollectivite.id }
      );
    expect(result.referentiels).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  test('DROM keeps TE readonly, CAE and ECI write whatever its activity', async () => {
    const { collectivite } = await setupIsolatedCollectivite(
      CollectiviteRole.EDITION,
      // Guadeloupe : drom = true (data_layer/seed/imports/01-region.sql)
      { regionCode: '01' }
    );
    const serviceRoleCaller = router.createCaller({
      user: getServiceRoleUser(),
    });

    const result =
      await serviceRoleCaller.referentiels.preferences.resetCollectiviteDisplayPreferences(
        { collectiviteId: collectivite.id }
      );

    expect(result.referentiels).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  test('Reset is a no-op when te.populatedFromCaeEci is already set', async () => {
    const { collectivite: isolatedCollectivite } =
      await setupIsolatedCollectivite();

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
    const { collectivite, authenticatedUser } =
      await setupIsolatedCollectivite();
    const caller = router.createCaller({ user: authenticatedUser });
    await expect(
      caller.referentiels.preferences.resetCollectiviteDisplayPreferences({
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrow('Droits insuffisants');
  });

  test('Only service role can call resetAllCollectivitesDisplayPreferences', async () => {
    await setupIsolatedCollectivite();
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
