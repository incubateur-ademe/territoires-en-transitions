import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
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
import { mergeFicheActionLinks } from './merge-fiche-action-links.rules';

describe('mergeFicheActionLinks', () => {
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
      fiches: true,
    });
  }

  async function setupTest() {
    await cleanupCollectiviteReferentielData();
  }

  async function createFicheWithLink(actionId: string) {
    const [fiche] = await databaseService.db
      .insert(ficheActionTable)
      .values({
        titre: `Fiche lien ${actionId}`,
        collectiviteId: collectivite.id,
      })
      .returning({ id: ficheActionTable.id });

    await databaseService.db
      .insert(ficheActionActionTable)
      .values({ ficheId: fiche.id, actionId });

    return { ficheId: fiche.id };
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
    return mergeFicheActionLinks(ctxResult.data);
  }

  test('lien sur mesure CAE 1→1 : migre vers mesure TE', async () => {
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCae1to1;
    const { ficheId } = await createFicheWithLink(caeMesureSourceId);

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data).toEqual(
      expect.arrayContaining([{ ficheId, actionId: teMesureId }])
    );
  });

  test('lien sur sous-mesure CAE avec correspondance directe TE', async () => {
    await setupTest();

    const { teSousActionId, caeSousMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teSousActionDirect;
    const { ficheId } = await createFicheWithLink(caeSousMesureSourceId);

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data).toEqual(
      expect.arrayContaining([{ ficheId, actionId: teSousActionId }])
    );
  });

  test('lien sur sous-mesure CAE sans direct : fallback mesure TE', async () => {
    await setupTest();

    const { teMesureId, caeSousMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureFallback;
    const { ficheId } = await createFicheWithLink(caeSousMesureSourceId);

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data).toEqual(
      expect.arrayContaining([{ ficheId, actionId: teMesureId }])
    );
    expect(
      data.some(
        (row) =>
          row.actionId ===
          SWITCH_TE_CORRESPONDANCES_FIXTURE.teSousActionDirect.teSousActionId
      )
    ).toBe(false);
  });

  test('deux liens CAE même fiche vers même mesure TE : dédup', async () => {
    await setupTest();

    const { teMesureId, caeMesureSourceId, caeSousMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureFallback;
    const [fiche] = await databaseService.db
      .insert(ficheActionTable)
      .values({
        titre: 'Fiche liens CAE dédup',
        collectiviteId: collectivite.id,
      })
      .returning({ id: ficheActionTable.id });

    await databaseService.db.insert(ficheActionActionTable).values([
      { ficheId: fiche.id, actionId: caeMesureSourceId },
      { ficheId: fiche.id, actionId: caeSousMesureSourceId },
    ]);

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    const rowsForFiche = data.filter((row) => row.ficheId === fiche.id);
    expect(rowsForFiche).toEqual([{ ficheId: fiche.id, actionId: teMesureId }]);
  });

  test('CAE + ECI, deux liens même fiche : multi-cibles indirectes ECI dédupliquées', async () => {
    await setupTest();

    const { teMesureId: teMesureCae, caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;
    const { eciMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCaeAndEci;

    const [fiche] = await databaseService.db
      .insert(ficheActionTable)
      .values({
        titre: 'Fiche liens mesures distinctes',
        collectiviteId: collectivite.id,
      })
      .returning({ id: ficheActionTable.id });

    await databaseService.db.insert(ficheActionActionTable).values([
      { ficheId: fiche.id, actionId: caeMesureSourceId },
      { ficheId: fiche.id, actionId: eciMesureSourceId },
    ]);

    const ctxResult = await buildCtx(prefsEligibleCaeAndEci);
    expect(ctxResult.success).toBe(true);
    if (!ctxResult.success) {
      throw new Error('buildSwitchToTeContext a échoué');
    }

    const data = mergeFicheActionLinks(ctxResult.data);

    const rowsForFiche = data.filter((row) => row.ficheId === fiche.id);
    const teMesureIds = [...new Set(rowsForFiche.map((row) => row.actionId))];

    // cae_6.1.3 → te_6.1.4 ; eci_3.3 → plusieurs mesures TE indirectes concernées
    expect(teMesureIds).toContain(teMesureCae);
    expect(teMesureIds.length).toBeGreaterThan(1);
    expect(rowsForFiche).toHaveLength(teMesureIds.length);
  });

  test('source non_concerne ignorée', async () => {
    await setupTest();

    const { caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCae1to1;
    await createFicheWithLink(caeMesureSourceId);
    await setActionNonConcerne(caeMesureSourceId);

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data).toEqual([]);
  });

  test('mesure TE cible non concernée absente du résultat', async () => {
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCae1to1;
    await createFicheWithLink(caeMesureSourceId);

    const caller = router.createCaller({ user });
    await caller.collectivites.personnalisations.setReponse({
      collectiviteId: collectivite.id,
      questionId: 'PCAET_1',
      reponse: false,
    });

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data.some((row) => row.actionId === teMesureId)).toBe(false);
  });

  test('fiche sans lien source : aucune ligne', async () => {
    await setupTest();

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data).toEqual([]);
  });

  test('sans pre-switch-te : failure PRE_SWITCH_SNAPSHOT_MISSING', async () => {
    await setupTest();

    const result = await buildCtx(prefsEligibleCaeOnly, []);

    expect(result).toEqual({
      success: false,
      error: SwitchToTeErrorEnum.PRE_SWITCH_SNAPSHOT_MISSING,
    });
  });
});
