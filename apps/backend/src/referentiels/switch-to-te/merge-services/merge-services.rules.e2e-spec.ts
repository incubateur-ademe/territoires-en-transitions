import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createServiceTag } from '@tet/backend/collectivites/tags/service-tag.fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  type Collectivite,
  type CollectiviteReferentielPreferences,
} from '@tet/domain/collectivites';
import { type ScoreSnapshot } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { BuildSwitchToTeContextService } from '../build-switch-to-te-context.service';
import { CreatePreSwitchSnapshotsService } from '../create-pre-switch-snapshots.service';
import { SWITCH_TE_CORRESPONDANCES_FIXTURE } from '../shared/switch-to-te-correspondances.fixture';
import {
  buildSwitchToTeContextForTest,
  cleanupSwitchToTeCollectiviteData,
  prefsEligibleCaeAndEci,
  prefsEligibleCaeOnly,
  setActionNonConcerneForCollectivite,
} from '../switch-to-te-context.test-fixture';
import { SwitchToTeErrorEnum } from '../switch-to-te.errors';
import { mergeServices } from './merge-services.rules';

describe('mergeServices', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let buildSwitchToTeContextService: BuildSwitchToTeContextService;
  let createPreSwitchSnapshotsService: CreatePreSwitchSnapshotsService;
  let collectivite: Collectivite;
  let user: AuthenticatedUser;
  let cleanupFixture: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    router = await getTestRouter(app);
    buildSwitchToTeContextService = app.get(BuildSwitchToTeContextService);
    createPreSwitchSnapshotsService = app.get(CreatePreSwitchSnapshotsService);

    const fixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = fixture.collectivite;
    cleanupFixture = fixture.cleanup;
    user = getAuthUserFromUserCredentials(fixture.user);
  });

  afterAll(async () => {
    await cleanupFixture();
    await app.close();
  });

  async function cleanupCollectiviteReferentielData() {
    await cleanupSwitchToTeCollectiviteData(databaseService, collectivite.id, {
      services: true,
    });
  }

  async function setupTest() {
    await cleanupCollectiviteReferentielData();
  }

  async function upsertServicesOnMesure(
    mesureId: string,
    serviceTagIds: number[]
  ) {
    const caller = router.createCaller({ user });
    const response = await caller.referentiels.actions.upsertServices({
      collectiviteId: collectivite.id,
      mesureId,
      services: serviceTagIds.map((serviceTagId) => ({ serviceTagId })),
    });
    return response[mesureId] ?? [];
  }

  async function setActionNonConcerne(actionId: string) {
    await setActionNonConcerneForCollectivite(
      router,
      user,
      collectivite.id,
      actionId
    );
  }

  async function buildCtx(
    prefs: CollectiviteReferentielPreferences,
    preSwitchSnapshots?: ScoreSnapshot[]
  ) {
    return buildSwitchToTeContextForTest(
      collectivite.id,
      prefs,
      {
        createPreSwitchSnapshotsService,
        buildSwitchToTeContextService,
      },
      { user, preSwitchSnapshots }
    );
  }

  async function mergeFromPrefs(
    prefs: CollectiviteReferentielPreferences,
    preSwitchSnapshots?: ScoreSnapshot[]
  ) {
    const ctxResult = await buildCtx(prefs, preSwitchSnapshots);
    expect(ctxResult.success).toBe(true);
    if (!ctxResult.success) {
      throw new Error('buildSwitchToTeContext a échoué');
    }
    return mergeServices(ctxResult.data);
  }

  test('CAE seul, 1 service sur mesure source : 1 ligne sur mesure TE', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCae1to1;
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service CAE fixture' },
    });

    await upsertServicesOnMesure(caeMesureSourceId, [serviceTag.id]);
    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data).toEqual(
      expect.arrayContaining([
        {
          collectiviteId: collectivite.id,
          actionId: teMesureId,
          serviceTagId: serviceTag.id,
        },
      ])
    );
  });

  test('CAE + ECI, service distinct par ref : union (2 lignes)', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId, eciMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    const caeServiceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service CAE fixture' },
    });
    const eciServiceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service ECI fixture' },
    });

    await upsertServicesOnMesure(caeMesureSourceId, [caeServiceTag.id]);
    await upsertServicesOnMesure(eciMesureSourceId, [eciServiceTag.id]);

    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    expect(data).toEqual(
      expect.arrayContaining([
        {
          collectiviteId: collectivite.id,
          actionId: teMesureId,
          serviceTagId: caeServiceTag.id,
        },
        {
          collectiviteId: collectivite.id,
          actionId: teMesureId,
          serviceTagId: eciServiceTag.id,
        },
      ])
    );
    expect(data.filter((row) => row.actionId === teMesureId)).toHaveLength(2);
  });

  test('CAE + ECI, même serviceTagId : dédup (1 ligne)', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId, eciMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    const sharedServiceTag = await createServiceTag({
      database: databaseService,
      tagData: {
        collectiviteId: collectivite.id,
        nom: 'Service partagé fixture',
      },
    });

    await upsertServicesOnMesure(caeMesureSourceId, [sharedServiceTag.id]);
    await upsertServicesOnMesure(eciMesureSourceId, [sharedServiceTag.id]);

    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    const rowsForMesure = data.filter((row) => row.actionId === teMesureId);
    expect(rowsForMesure).toEqual([
      {
        collectiviteId: collectivite.id,
        actionId: teMesureId,
        serviceTagId: sharedServiceTag.id,
      },
    ]);
  });

  test('origine tâche, services sur mesure source : remontée OK', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: {
        collectiviteId: collectivite.id,
        nom: 'Service remontée fixture',
      },
    });

    await upsertServicesOnMesure(caeMesureSourceId, [serviceTag.id]);
    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(
      data.some(
        (row) =>
          row.actionId === teMesureId && row.serviceTagId === serviceTag.id
      )
    ).toBe(true);
  });

  test('source non_concerne ignorée : aucun service migré depuis cette source', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const {
      teMesureId,
      caeMesureSourceId,
      eciMesureSourceId,
      eciOrigineTacheId,
    } = SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    const caeServiceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service CAE fixture' },
    });
    const eciServiceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service ECI fixture' },
    });

    await upsertServicesOnMesure(caeMesureSourceId, [caeServiceTag.id]);
    await upsertServicesOnMesure(eciMesureSourceId, [eciServiceTag.id]);
    await setActionNonConcerne(eciOrigineTacheId);

    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    const rowsForMesure = data.filter((row) => row.actionId === teMesureId);
    expect(rowsForMesure).toEqual([
      {
        collectiviteId: collectivite.id,
        actionId: teMesureId,
        serviceTagId: caeServiceTag.id,
      },
    ]);
  });

  test('mesure TE non concernée absente du résultat', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCae1to1;
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: {
        collectiviteId: collectivite.id,
        nom: 'Service PCAET fixture',
      },
    });

    await upsertServicesOnMesure(caeMesureSourceId, [serviceTag.id]);

    const caller = router.createCaller({ user });
    await caller.collectivites.personnalisations.setReponse({
      collectiviteId: collectivite.id,
      questionId: 'PCAET_1',
      reponse: false,
    });

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data.some((row) => row.actionId === teMesureId)).toBe(false);
  });

  test('mesure sans service source : aucune ligne', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data).toEqual([]);
  });

  test('sans pre-switch-te : failure PRE_SWITCH_SNAPSHOT_MISSING', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const result = await buildCtx(prefsEligibleCaeOnly, []);

    expect(result).toEqual({
      success: false,
      error: SwitchToTeErrorEnum.PRE_SWITCH_SNAPSHOT_MISSING,
    });
  });
});
