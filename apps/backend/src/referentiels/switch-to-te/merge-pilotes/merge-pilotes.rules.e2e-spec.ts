import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createPersonneTag } from '@tet/backend/collectivites/tags/personnes/personne-tag.fixture';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { actionPiloteTable } from '@tet/backend/referentiels/models/action-pilote.table';
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
import { type ScoreSnapshot } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { BuildSwitchToTeContextService } from '../build-switch-to-te-context.service';
import { CreatePreSwitchSnapshotsService } from '../create-pre-switch-snapshots.service';
import { buildSwitchToTeContextForTest } from '../switch-to-te-context.test-fixture';
import { SwitchToTeErrorEnum } from '../switch-to-te.errors';
import { mergePilotes } from './merge-pilotes.rules';

const prefsEligibleCaeOnly: CollectiviteReferentielPreferences = {
  cae: { display: true, mode: 'write' },
  eci: { display: false, mode: 'archived' },
  te: { display: true, mode: 'readonly' },
};

const prefsEligibleCaeAndEci: CollectiviteReferentielPreferences = {
  cae: { display: true, mode: 'write' },
  eci: { display: true, mode: 'write' },
  te: { display: true, mode: 'readonly' },
};

/**
 * Exemples figés depuis `import-referentiel/samples/referentiel-te-structure.csv`.
 * À mettre à jour si le CSV TE change
 */
const MERGE_PILOTES_FIXTURE = {
  teMesureCae1to1: {
    teMesureId: 'te_1.1.1',
    caeOrigineActionId: 'cae_1.1.2.2.1',
    caeMesureSourceId: 'cae_1.1.2',
  },
  teMesureCaeAndEci: {
    teMesureId: 'te_6.1.4',
    caeOrigineTacheId: 'cae_6.1.3.4.3',
    caeMesureSourceId: 'cae_6.1.3',
    eciOrigineTacheId: 'eci_3.3.1.3',
    eciMesureSourceId: 'eci_3.3',
  },
  /** sous-action native — absente de cibles.mesures */
  teMesureNative: 'te_1.1.1.3',
} as const;

describe('mergePilotes', () => {
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
      .delete(personneTagTable)
      .where(eq(personneTagTable.collectiviteId, collectivite.id));
    await databaseService.db
      .delete(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, collectivite.id),
          eq(snapshotTable.ref, SNAPSHOTS.PRE_SWITCH_TE_REF)
        )
      );
  }

  async function setupTest() {
    await cleanupCollectiviteReferentielData();
  }

  async function upsertPilotesOnMesure(
    mesureId: string,
    pilotes: { userId?: string | null; tagId?: number | null }[]
  ) {
    const caller = router.createCaller({ user });
    const response = await caller.referentiels.actions.upsertPilotes({
      collectiviteId: collectivite.id,
      mesureId,
      pilotes,
    });
    return response[mesureId] ?? [];
  }

  async function setActionNonConcerne(actionId: string) {
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.updateStatuts({
      actionStatuts: [
        {
          collectiviteId: collectivite.id,
          actionId,
          statut: 'non_concerne',
        },
      ],
    });
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
    return mergePilotes(ctxResult.data);
  }

  test('CAE seul, userId sur mesure source : pilote sur mesure TE', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      MERGE_PILOTES_FIXTURE.teMesureCae1to1;

    await upsertPilotesOnMesure(caeMesureSourceId, [{ userId }]);
    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data).toEqual(
      expect.arrayContaining([
        {
          collectiviteId: collectivite.id,
          actionId: teMesureId,
          userId,
          tagId: null,
        },
      ])
    );
  });

  test('CAE + ECI, userId CAE + tagId ECI : union', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId, eciMesureSourceId } =
      MERGE_PILOTES_FIXTURE.teMesureCaeAndEci;
    const personneTag = await createPersonneTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Pilote ECI fixture' },
    });

    await upsertPilotesOnMesure(caeMesureSourceId, [{ userId }]);
    await upsertPilotesOnMesure(eciMesureSourceId, [
      { userId: null, tagId: personneTag.id },
    ]);

    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    expect(data).toEqual(
      expect.arrayContaining([
        {
          collectiviteId: collectivite.id,
          actionId: teMesureId,
          userId,
          tagId: null,
        },
        {
          collectiviteId: collectivite.id,
          actionId: teMesureId,
          userId: null,
          tagId: personneTag.id,
        },
      ])
    );
    expect(data.filter((row) => row.actionId === teMesureId)).toHaveLength(2);
  });

  test('CAE + ECI, même userId : dédup', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId, eciMesureSourceId } =
      MERGE_PILOTES_FIXTURE.teMesureCaeAndEci;

    await upsertPilotesOnMesure(caeMesureSourceId, [{ userId }]);
    await upsertPilotesOnMesure(eciMesureSourceId, [{ userId }]);

    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    const rowsForMesure = data.filter((row) => row.actionId === teMesureId);
    expect(rowsForMesure).toEqual([
      {
        collectiviteId: collectivite.id,
        actionId: teMesureId,
        userId,
        tagId: null,
      },
    ]);
  });

  test('origine tâche, pilote sur mesure source : remontée OK', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      MERGE_PILOTES_FIXTURE.teMesureCaeAndEci;

    await upsertPilotesOnMesure(caeMesureSourceId, [{ userId }]);
    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(
      data.some((row) => row.actionId === teMesureId && row.userId === userId)
    ).toBe(true);
  });

  test('source non_concerne ignorée : aucun pilote migré depuis cette source', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const {
      teMesureId,
      caeMesureSourceId,
      eciMesureSourceId,
      eciOrigineTacheId,
    } = MERGE_PILOTES_FIXTURE.teMesureCaeAndEci;

    await upsertPilotesOnMesure(caeMesureSourceId, [{ userId }]);
    await upsertPilotesOnMesure(eciMesureSourceId, [{ userId }]);
    await setActionNonConcerne(eciOrigineTacheId);

    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    const rowsForMesure = data.filter((row) => row.actionId === teMesureId);
    expect(rowsForMesure).toEqual([
      {
        collectiviteId: collectivite.id,
        actionId: teMesureId,
        userId,
        tagId: null,
      },
    ]);
  });

  test('mesure TE non concernée absente du résultat', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      MERGE_PILOTES_FIXTURE.teMesureCae1to1;

    await upsertPilotesOnMesure(caeMesureSourceId, [{ userId }]);

    const caller = router.createCaller({ user });
    await caller.collectivites.personnalisations.setReponse({
      collectiviteId: collectivite.id,
      questionId: 'PCAET_1',
      reponse: false,
    });

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(data.some((row) => row.actionId === teMesureId)).toBe(false);
  });

  test('mesure sans pilote source : aucune ligne', async () => {
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
