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
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { BuildSwitchToTeContextService } from './build-switch-to-te-context.service';
import { CreatePreSwitchSnapshotsService } from './create-pre-switch-snapshots.service';
import { SWITCH_TE_CORRESPONDANCES_FIXTURE } from './shared/switch-to-te-correspondances.fixture';
import {
  buildSwitchToTeContextForTest,
  cleanupSwitchToTeCollectiviteReferentielData,
  createFicheWithLinkOnAction,
  prefsEligibleCaeOnly,
  setActionsNonConcernesForCollectivite,
  upsertPilotesOnMesure,
  upsertServicesOnMesure,
} from './switch-to-te-context.test-fixture';

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
    await cleanupSwitchToTeCollectiviteReferentielData(
      databaseService,
      collectivite.id
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

    const { caeMesureSourceId } = SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    await upsertPilotesOnMesure(router, user, collectivite.id, caeMesureSourceId, [
      { userId },
    ]);

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.pilotesByMesureActionId.get(caeMesureSourceId)).toEqual([
      { userId, tagId: null },
    ]);
    expect(
      result.data.cibles.mesures.some(
        (cible) =>
          cible.actionId === SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci.teMesureId
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
    await upsertPilotesOnMesure(router, user, collectivite.id, 'cae_1.1.2', [
      { userId },
    ]);
    await setActionsNonConcernesForCollectivite(
      router,
      user,
      collectivite.id,
      caeOriginesNonConcernees
    );

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
        (cible) => cible.actionId === SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureNative
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
          cible.actionId === SWITCH_TE_CORRESPONDANCES_FIXTURE.teSousActionRegression
      )
    ).toBe(true);
  });

  test('CAE seul, service sur mesure source : servicesByMesureActionId peuplé', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const { caeMesureSourceId } = SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service builder fixture' },
    });
    await upsertServicesOnMesure(router, user, collectivite.id, caeMesureSourceId, [
      serviceTag.id,
    ]);

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
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service ancêtre fixture' },
    });
    await upsertServicesOnMesure(router, user, collectivite.id, caeMesureSourceId, [
      serviceTag.id,
    ]);

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
    await upsertServicesOnMesure(router, user, collectivite.id, 'cae_1.1.2', [
      serviceTag.id,
    ]);
    await setActionsNonConcernesForCollectivite(
      router,
      user,
      collectivite.id,
      caeOriginesNonConcernees
    );

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.servicesByMesureActionId.size).toBe(0);
  });

  test('régression PR14 : pilotesByMesureActionId + cibles inchangés', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const { caeMesureSourceId } = SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    await upsertPilotesOnMesure(router, user, collectivite.id, caeMesureSourceId, [
      { userId },
    ]);

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.pilotesByMesureActionId.get(caeMesureSourceId)).toEqual([
      { userId, tagId: null },
    ]);
    expect(
      result.data.cibles.mesures.some(
        (cible) =>
          cible.actionId === SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci.teMesureId
      )
    ).toBe(true);
  });

  test('lien sur mesure CAE source : sourceFicheLinks contient l entrée', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const { caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCae1to1;
    const { ficheId } = await createFicheWithLinkOnAction(
      databaseService,
      collectivite.id,
      caeMesureSourceId
    );

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.sourceFicheLinks).toEqual(
      expect.arrayContaining([{ ficheId, actionId: caeMesureSourceId }])
    );
  });

  test('ECI archivé : liens eci_* absents de sourceFicheLinks', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const { eciMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    await createFicheWithLinkOnAction(
      databaseService,
      collectivite.id,
      eciMesureSourceId
    );

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(
      result.data.sourceFicheLinks.some((link) =>
        link.actionId.startsWith('eci_')
      )
    ).toBe(false);
  });

  test('aucun lien en base : sourceFicheLinks vide', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.sourceFicheLinks).toEqual([]);
  });

  test('régression PR14/15 : pilotes, services et cibles inchangés', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);

    const { caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: {
        collectiviteId: collectivite.id,
        nom: 'Service régression builder',
      },
    });
    await upsertPilotesOnMesure(router, user, collectivite.id, caeMesureSourceId, [
      { userId },
    ]);
    await upsertServicesOnMesure(router, user, collectivite.id, caeMesureSourceId, [
      serviceTag.id,
    ]);

    const result = await buildCtx(prefsEligibleCaeOnly);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.pilotesByMesureActionId.get(caeMesureSourceId)).toEqual([
      { userId, tagId: null },
    ]);
    expect(result.data.servicesByMesureActionId.get(caeMesureSourceId)).toEqual([
      serviceTag.id,
    ]);
    expect(
      result.data.cibles.mesures.some(
        (cible) =>
          cible.actionId ===
          SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci.teMesureId
      )
    ).toBe(true);
  });
});
