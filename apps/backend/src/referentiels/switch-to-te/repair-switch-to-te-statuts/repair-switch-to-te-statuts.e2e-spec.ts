import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { buildScoreMapByActionId } from '@tet/backend/referentiels/compute-score/score-map.rules';
import ScoresService from '@tet/backend/referentiels/compute-score/scores.service';
import { actionStatutTable } from '@tet/backend/referentiels/models/action-statut.table';
import { snapshotTable } from '@tet/backend/referentiels/snapshots/snapshot.table';
import { SNAPSHOTS } from '@tet/backend/referentiels/snapshots/snapshots.constants';
import {
  getAuthUserFromUserCredentials,
  getServiceRoleUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  ReferentielIdEnum,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, like, sql } from 'drizzle-orm';
import { SWITCH_TE_CORRESPONDANCES_FIXTURE } from '../shared/switch-to-te-correspondances.fixture';
import {
  cleanupSwitchToTeCollectiviteReferentielData,
  prefsEligibleCaeOnly,
  setActionStatutForCollectivite,
} from '../switch-to-te-context.test-fixture';
import { switchToTeTrpcErrorEntries } from '../switch-to-te.errors';

// PCAET_1 = NON désactive te_1.1.1 (et active te_1.1.1alter)
const { teMesureId, caeOrigineActionId } =
  SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCae1to1;
const TE_SOUS_MESURE_REPRISE = 'te_1.1.1.2'; // origine cae_1.1.2.2.1
const TE_SOUS_MESURE_MODIFIEE = 'te_1.1.1.4';
const TE_SOUS_MESURE_ACTIVE_A_LA_BASCULE = 'te_1.1.1alter.1';

describe('Rattrapage des statuts TE des collectivités déjà basculées', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let supportCaller: ReturnType<TrpcRouter['createCaller']>;
  let serviceRoleCaller: ReturnType<TrpcRouter['createCaller']>;
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

    serviceRoleCaller = router.createCaller({ user: getServiceRoleUser() });
  });

  afterAll(async () => {
    await cleanupSuperAdminMode();
    await cleanupSupportUser();
    await app.close();
  });

  async function setupCollectivite() {
    const fixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [{ role: CollectiviteRole.ADMIN }],
    });
    onTestFinished(() => fixture.cleanup());
    const collectiviteId = fixture.collectivite.id;
    onTestFinished(() =>
      cleanupSwitchToTeCollectiviteReferentielData(
        databaseService,
        collectiviteId
      )
    );

    await supportCaller.collectivites.preferences.update({
      collectiviteId,
      preferences: { referentiels: prefsEligibleCaeOnly },
    });

    const adminUser = getAuthUserFromUserCredentials(fixture.users[0]);
    return {
      collectiviteId,
      adminUser,
      adminCaller: router.createCaller({ user: adminUser }),
    };
  }

  async function setPcaet(
    adminCaller: ReturnType<TrpcRouter['createCaller']>,
    collectiviteId: number,
    reponse: boolean
  ) {
    await adminCaller.collectivites.personnalisations.setReponse({
      collectiviteId,
      questionId: 'PCAET_1',
      reponse,
    });
  }

  async function listTeStatuts(collectiviteId: number) {
    return databaseService.db
      .select({
        actionId: actionStatutTable.actionId,
        avancement: actionStatutTable.avancement,
        concerne: actionStatutTable.concerne,
        modifiedAt: sql<string>`${actionStatutTable.modifiedAt}::text`,
      })
      .from(actionStatutTable)
      .where(
        and(
          eq(actionStatutTable.collectiviteId, collectiviteId),
          like(actionStatutTable.actionId, 'te_%')
        )
      );
  }

  async function getScoreCourantModifiedAt(collectiviteId: number) {
    const [row] = await databaseService.db
      .select({ modifiedAt: sql<string>`${snapshotTable.modifiedAt}::text` })
      .from(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, collectiviteId),
          eq(snapshotTable.referentielId, ReferentielIdEnum.TE),
          eq(snapshotTable.ref, SNAPSHOTS.SCORE_COURANT_REF)
        )
      );
    return row?.modifiedAt;
  }

  /**
   * Remplace (ou crée) le statut d'une action par « Non concerné », comme
   * l'écrivait la bascule avant le correctif. L'insert n'est pas soumis au
   * trigger `update_modified_at` : on peut fixer `modified_at`.
   */
  async function writeNonConcerne(
    collectiviteId: number,
    actionId: string,
    modifiedBy: string,
    modifiedAt?: string
  ) {
    await databaseService.db
      .delete(actionStatutTable)
      .where(
        and(
          eq(actionStatutTable.collectiviteId, collectiviteId),
          eq(actionStatutTable.actionId, actionId)
        )
      );
    await databaseService.db.insert(actionStatutTable).values({
      collectiviteId,
      actionId,
      avancement: StatutAvancementEnum.NON_RENSEIGNE,
      avancementDetaille: null,
      concerne: false,
      modifiedBy,
      ...(modifiedAt ? { modifiedAt } : {}),
    });
  }

  /**
   * Bascule avec te_1.1.1 désactivée, puis remet les données dans l'état
   * laissé par l'ancienne bascule.
   */
  async function setupAncienneBascule() {
    const { collectiviteId, adminUser, adminCaller } =
      await setupCollectivite();

    await setActionStatutForCollectivite(
      router,
      adminUser,
      collectiviteId,
      caeOrigineActionId,
      StatutAvancementEnum.FAIT
    );
    await setPcaet(adminCaller, collectiviteId, false);
    await adminCaller.referentiels.switchToTe({ collectiviteId });

    const statuts = await listTeStatuts(collectiviteId);
    const basculeModifiedAt = statuts.find(
      (statut) => statut.actionId === TE_SOUS_MESURE_REPRISE
    )?.modifiedAt;
    expect(basculeModifiedAt).toBeDefined();
    if (!basculeModifiedAt) throw new Error('statut de bascule manquant');

    // l'ancienne bascule écrivait « Non concerné » sur la sous-mesure reprise
    await writeNonConcerne(
      collectiviteId,
      TE_SOUS_MESURE_REPRISE,
      adminUser.id,
      basculeModifiedAt
    );
    // ligne sans équivalent dans la bascule corrigée (comme les tâches) :
    // doit être supprimée
    await writeNonConcerne(
      collectiviteId,
      teMesureId,
      adminUser.id,
      basculeModifiedAt
    );
    // sous-mesure modifiée depuis la bascule : jamais touchée
    await writeNonConcerne(
      collectiviteId,
      TE_SOUS_MESURE_MODIFIEE,
      adminUser.id
    );
    // « Non concerné » sur une action active à la bascule : hors du bug
    await writeNonConcerne(
      collectiviteId,
      TE_SOUS_MESURE_ACTIVE_A_LA_BASCULE,
      adminUser.id,
      basculeModifiedAt
    );

    return { collectiviteId, adminUser, adminCaller, basculeModifiedAt };
  }

  test('refuse un appel sans service role', async () => {
    const { collectiviteId, adminCaller } = await setupCollectivite();

    await expect(
      adminCaller.referentiels.repairSwitchToTeStatuts({ collectiviteId })
    ).rejects.toThrow();
  });

  test('refuse une collectivité non basculée', async () => {
    const { collectiviteId } = await setupCollectivite();

    await expect(
      serviceRoleCaller.referentiels.repairSwitchToTeStatuts({
        collectiviteId,
      })
    ).rejects.toThrow(switchToTeTrpcErrorEntries.NOT_SWITCHED.message);
  });

  test("aucune ligne dans la minute qui suit populatedAt : l'heure de bascule n'est pas devinée, rien n'est écrit", async () => {
    const { collectiviteId } = await setupAncienneBascule();
    // populatedAt reculé d'une heure : les statuts de bascule (et toute saisie
    // ultérieure de son auteur) sont hors de la fenêtre de recherche
    await databaseService.db.execute(sql`
      update collectivite
      set preferences = jsonb_set(
        preferences,
        '{referentiels,te,populatedFromCaeEci,populatedAt}',
        to_jsonb(
          to_char(
            ((preferences #>> '{referentiels,te,populatedFromCaeEci,populatedAt}')::timestamptz
              - interval '1 hour') at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
          )
        )
      )
      where id = ${collectiviteId}
    `);
    const statutsAvant = await listTeStatuts(collectiviteId);

    const report = await serviceRoleCaller.referentiels.repairSwitchToTeStatuts(
      {
        collectiviteId,
        dryRun: false,
      }
    );

    expect(report.basculeModifiedAt).toBeNull();
    expect(report.lignes).toEqual([]);
    expect(await listTeStatuts(collectiviteId)).toEqual(
      expect.arrayContaining(statutsAvant)
    );
    expect(await listTeStatuts(collectiviteId)).toHaveLength(
      statutsAvant.length
    );
  });

  test('dry-run : rapport complet, aucune écriture', async () => {
    const { collectiviteId, adminUser, basculeModifiedAt } =
      await setupAncienneBascule();
    const statutsAvant = await listTeStatuts(collectiviteId);

    const report = await serviceRoleCaller.referentiels.repairSwitchToTeStatuts(
      { collectiviteId }
    );

    expect(report.dryRun).toBe(true);
    expect(report.populatedBy).toBe(adminUser.id);
    expect(report.repairedAt).toBeNull();
    expect(report.basculeModifiedAt).toBe(basculeModifiedAt);
    expect(report.versions.te.bascule).toBe(report.versions.te.actuelle);
    expect(report.versions.te.differentes).toBe(false);
    expect(report.versions.sources).toEqual([
      expect.objectContaining({
        referentielId: ReferentielIdEnum.CAE,
        differentes: false,
      }),
    ]);
    expect(report.lignes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: TE_SOUS_MESURE_REPRISE,
          decision: 'update',
          statut: expect.objectContaining({
            statut: StatutAvancementEnum.FAIT,
          }),
          activeAujourdhui: false,
          appliquee: null,
        }),
        expect.objectContaining({ actionId: teMesureId, decision: 'delete' }),
        // désactivée à la bascule, origines non concernées : reste NC
        expect.objectContaining({ decision: 'keep', appliquee: null }),
      ])
    );
    const actionIds = report.lignes.map((ligne) => ligne.actionId);
    expect(actionIds).not.toContain(TE_SOUS_MESURE_MODIFIEE);
    expect(actionIds).not.toContain(TE_SOUS_MESURE_ACTIVE_A_LA_BASCULE);
    expect(report.compteurs.ignoreesActivesALaBascule).toBeGreaterThanOrEqual(
      1
    );
    // la mesure reste désactivée : le statut repris ne change pas le score
    expect(report.score.apres).toEqual(report.score.avant);

    expect(await listTeStatuts(collectiviteId)).toEqual(
      expect.arrayContaining(statutsAvant)
    );
    expect(await listTeStatuts(collectiviteId)).toHaveLength(
      statutsAvant.length
    );
  });

  test('exécution : corrige les seules lignes intactes, idempotente, score repris une fois la mesure activée', async () => {
    const { collectiviteId, adminCaller } = await setupAncienneBascule();

    const report = await serviceRoleCaller.referentiels.repairSwitchToTeStatuts(
      { collectiviteId, dryRun: false }
    );
    expect(report.compteurs.nonAppliquees).toBe(0);
    const keptActionIds = report.lignes
      .filter((ligne) => ligne.decision === 'keep')
      .map((ligne) => ligne.actionId);
    expect(keptActionIds.length).toBeGreaterThan(0);

    const statuts = await listTeStatuts(collectiviteId);
    const byActionId = new Map(statuts.map((s) => [s.actionId, s]));
    expect(byActionId.get(TE_SOUS_MESURE_REPRISE)).toMatchObject({
      avancement: StatutAvancementEnum.FAIT,
      concerne: true,
    });
    // toutes les lignes écrites portent l'horodatage donné par le rapport
    expect(report.repairedAt).not.toBeNull();
    expect(byActionId.get(TE_SOUS_MESURE_REPRISE)?.modifiedAt).toBe(
      report.repairedAt
    );
    expect(byActionId.has(teMesureId)).toBe(false);
    for (const actionId of [
      ...keptActionIds,
      TE_SOUS_MESURE_MODIFIEE,
      TE_SOUS_MESURE_ACTIVE_A_LA_BASCULE,
    ]) {
      expect(byActionId.get(actionId)).toMatchObject({
        avancement: StatutAvancementEnum.NON_RENSEIGNE,
        concerne: false,
      });
    }

    // 2e exécution : plus rien à écrire, mais le score courant est recalculé
    const scoreCourantModifiedAt = await getScoreCourantModifiedAt(
      collectiviteId
    );
    const second = await serviceRoleCaller.referentiels.repairSwitchToTeStatuts(
      {
        collectiviteId,
        dryRun: false,
      }
    );
    expect(second.compteurs).toMatchObject({ misesAJour: 0, suppressions: 0 });
    expect(await getScoreCourantModifiedAt(collectiviteId)).not.toBe(
      scoreCourantModifiedAt
    );

    // la collectivité répond à la question : la mesure s'active, le statut
    // repris compte dans le score
    await setPcaet(adminCaller, collectiviteId, true);
    const { scoresPayload } = await app
      .get(ScoresService)
      .computeScoreForCollectivite(ReferentielIdEnum.TE, collectiviteId, {
        avecReferentielsOrigine: false,
      });
    const score = buildScoreMapByActionId(scoresPayload.scores).get(
      TE_SOUS_MESURE_REPRISE
    );
    expect(score?.desactive).toBe(false);
    expect(score?.pointFait).toBeGreaterThan(0);
  });
});
