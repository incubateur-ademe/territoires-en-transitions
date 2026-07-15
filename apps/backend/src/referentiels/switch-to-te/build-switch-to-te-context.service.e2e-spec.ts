import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createServiceTag } from '@tet/backend/collectivites/tags/service-tag.fixture';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { actionPiloteTable } from '@tet/backend/referentiels/models/action-pilote.table';
import { actionServiceTable } from '@tet/backend/referentiels/models/action-service.table';
import { snapshotTable } from '@tet/backend/referentiels/snapshots/snapshot.table';
import { SNAPSHOTS } from '@tet/backend/referentiels/snapshots/snapshots.constants';
import { cleanupReferentielActionStatutsAndLabellisations } from '@tet/backend/referentiels/update-action-statut/referentiel-action-statut.test-fixture';
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
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { BuildSwitchToTeContextService } from './build-switch-to-te-context.service';
import { CreatePreSwitchSnapshotsService } from './create-pre-switch-snapshots.service';
import { buildSwitchToTeContextForTest } from './switch-to-te-context.test-fixture';

const prefsEligibleCaeOnly: CollectiviteReferentielPreferences = {
  cae: { display: true, mode: 'write' },
  eci: { display: false, mode: 'archived' },
  te: { display: true, mode: 'readonly' },
};

const MERGE_PILOTES_FIXTURE = {
  teMesureCaeAndEci: {
    teMesureId: 'te_6.1.4',
    caeMesureSourceId: 'cae_6.1.3',
    eciMesureSourceId: 'eci_3.3',
    eciOrigineTacheId: 'eci_3.3.1.3',
  },
  teMesureNative: 'te_1.1.1.3',
  teSousActionRegression: 'te_1.1.1.2',
} as const;

describe('BuildSwitchToTeContextService', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let buildSwitchToTeContextService: BuildSwitchToTeContextService;
  let createPreSwitchSnapshotsService: CreatePreSwitchSnapshotsService;
  let collectivite: Collectivite;
  let user: AuthenticatedUser;
  let userId: string;
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
    userId = fixture.user.id;
  });

  afterAll(async () => {
    await cleanupFixture();
    await app.close();
  });

  async function cleanupCollectiviteReferentielData() {
    await cleanupReferentielActionStatutsAndLabellisations(
      databaseService,
      collectivite.id
    );
    await databaseService.db
      .delete(actionPiloteTable)
      .where(eq(actionPiloteTable.collectiviteId, collectivite.id));
    await databaseService.db
      .delete(actionServiceTable)
      .where(eq(actionServiceTable.collectiviteId, collectivite.id));
    await databaseService.db
      .delete(serviceTagTable)
      .where(eq(serviceTagTable.collectiviteId, collectivite.id));
    await databaseService.db
      .delete(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, collectivite.id),
          eq(snapshotTable.ref, SNAPSHOTS.PRE_SWITCH_TE_REF)
        )
      );
  }

  async function buildCtx(prefs: CollectiviteReferentielPreferences) {
    return buildSwitchToTeContextForTest(
      collectivite.id,
      prefs,
      {
        createPreSwitchSnapshotsService,
        buildSwitchToTeContextService,
      },
      { user }
    );
  }

  test('CAE seul : hierarchiesByReferentielId contient CAE, pas ECI archivé', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(
      result.data.hierarchiesByReferentielId.has(ReferentielIdEnum.CAE)
    ).toBe(true);
    expect(
      result.data.hierarchiesByReferentielId.has(ReferentielIdEnum.ECI)
    ).toBe(false);
  });

  test('origine tâche dans cibles.mesures : pilotesByMesureActionId peuplé pour mesure remontée', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const { caeMesureSourceId } = MERGE_PILOTES_FIXTURE.teMesureCaeAndEci;
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.upsertPilotes({
      collectiviteId: collectivite.id,
      mesureId: caeMesureSourceId,
      pilotes: [{ userId }],
    });

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.pilotesByMesureActionId.get(caeMesureSourceId)).toEqual([
      { userId, tagId: null },
    ]);
    expect(
      result.data.cibles.mesures.some(
        (cible) =>
          cible.actionId === MERGE_PILOTES_FIXTURE.teMesureCaeAndEci.teMesureId
      )
    ).toBe(true);
  });

  test('aucune origine concernée : pilotesByMesureActionId vide', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const caeOriginesNonConcernees = [
      'cae_1.1.2.2.3',
      'cae_1.1.2.2.1',
      'cae_1.1.2.2.2',
      'cae_1.1.2.2.5',
    ];
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.upsertPilotes({
      collectiviteId: collectivite.id,
      mesureId: 'cae_1.1.2',
      pilotes: [{ userId }],
    });
    await caller.referentiels.actions.updateStatuts({
      actionStatuts: caeOriginesNonConcernees.map((actionId) => ({
        collectiviteId: collectivite.id,
        actionId,
        statut: 'non_concerne' as const,
      })),
    });

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    const teMesure = result.data.cibles.mesures.find(
      (cible) => cible.actionId === 'te_1.1.1'
    );
    expect(teMesure?.originesConcernees).toHaveLength(0);
    expect(result.data.pilotesByMesureActionId.size).toBe(0);
  });

  test('teMesureNative absente de cibles.mesures', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(
      result.data.cibles.mesures.some(
        (cible) => cible.actionId === MERGE_PILOTES_FIXTURE.teMesureNative
      )
    ).toBe(false);
  });

  test('régression PR12/13 : cibles.sousActionsEtTaches inchangé', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(
      result.data.cibles.sousActionsEtTaches.some(
        (cible) =>
          cible.actionId === MERGE_PILOTES_FIXTURE.teSousActionRegression
      )
    ).toBe(true);
  });

  test('CAE seul, service sur mesure source : servicesByMesureActionId peuplé', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const { caeMesureSourceId } = MERGE_PILOTES_FIXTURE.teMesureCaeAndEci;
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service builder fixture' },
    });
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.upsertServices({
      collectiviteId: collectivite.id,
      mesureId: caeMesureSourceId,
      services: [{ serviceTagId: serviceTag.id }],
    });

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.servicesByMesureActionId.get(caeMesureSourceId)).toEqual([
      serviceTag.id,
    ]);
  });

  test('origine tâche dans cibles.mesures : services sur mesure ancêtre', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const { caeMesureSourceId, teMesureId } =
      MERGE_PILOTES_FIXTURE.teMesureCaeAndEci;
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service ancêtre fixture' },
    });
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.upsertServices({
      collectiviteId: collectivite.id,
      mesureId: caeMesureSourceId,
      services: [{ serviceTagId: serviceTag.id }],
    });

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.servicesByMesureActionId.get(caeMesureSourceId)).toEqual([
      serviceTag.id,
    ]);
    expect(
      result.data.cibles.mesures.some((cible) => cible.actionId === teMesureId)
    ).toBe(true);
    expect(
      result.data.servicesByMesureActionId.has('cae_6.1.3.4.3')
    ).toBe(false);
  });

  test('aucune origine concernée : servicesByMesureActionId vide', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const caeOriginesNonConcernees = [
      'cae_1.1.2.2.3',
      'cae_1.1.2.2.1',
      'cae_1.1.2.2.2',
      'cae_1.1.2.2.5',
    ];
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service ignoré fixture' },
    });
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.upsertServices({
      collectiviteId: collectivite.id,
      mesureId: 'cae_1.1.2',
      services: [{ serviceTagId: serviceTag.id }],
    });
    await caller.referentiels.actions.updateStatuts({
      actionStatuts: caeOriginesNonConcernees.map((actionId) => ({
        collectiviteId: collectivite.id,
        actionId,
        statut: 'non_concerne' as const,
      })),
    });

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.servicesByMesureActionId.size).toBe(0);
  });

  test('régression PR14 : pilotesByMesureActionId + cibles inchangés', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const { caeMesureSourceId } = MERGE_PILOTES_FIXTURE.teMesureCaeAndEci;
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.upsertPilotes({
      collectiviteId: collectivite.id,
      mesureId: caeMesureSourceId,
      pilotes: [{ userId }],
    });

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.pilotesByMesureActionId.get(caeMesureSourceId)).toEqual([
      { userId, tagId: null },
    ]);
    expect(
      result.data.cibles.mesures.some(
        (cible) =>
          cible.actionId === MERGE_PILOTES_FIXTURE.teMesureCaeAndEci.teMesureId
      )
    ).toBe(true);
  });
});
