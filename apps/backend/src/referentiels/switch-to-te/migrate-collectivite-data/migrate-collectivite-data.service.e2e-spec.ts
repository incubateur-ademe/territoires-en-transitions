import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createServiceTag } from '@tet/backend/collectivites/tags/service-tag.fixture';
import { ficheActionActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { actionCommentaireTable } from '@tet/backend/referentiels/models/action-commentaire.table';
import { actionPiloteTable } from '@tet/backend/referentiels/models/action-pilote.table';
import { actionServiceTable } from '@tet/backend/referentiels/models/action-service.table';
import { actionStatutTable } from '@tet/backend/referentiels/models/action-statut.table';
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
import {
  StatutAvancementEnum,
  type ScoreSnapshot,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, like } from 'drizzle-orm';
import { CreatePreSwitchSnapshotsService } from '../create-pre-switch-snapshots.service';
import { MERGE_COMMENTAIRES_PREFIX } from '../merge-commentaires/merge-commentaires.rules';
import { MigrateCollectiviteDataRepository } from './migrate-collectivite-data.repository';
import { MigrateCollectiviteDataService } from './migrate-collectivite-data.service';
import { SWITCH_TE_CORRESPONDANCES_FIXTURE } from '../shared/switch-to-te-correspondances.fixture';
import {
  cleanupSwitchToTeCollectiviteReferentielData,
  createFicheWithLinkOnAction,
  prefsEligibleCaeAndEci,
  prefsEligibleCaeOnly,
  setActionCommentaireForCollectivite,
  setActionStatutForCollectivite,
  upsertPilotesOnMesure,
  upsertServicesOnMesure,
} from '../switch-to-te-context.test-fixture';
import { SwitchToTeErrorEnum } from '../switch-to-te.errors';

const MIGRATE_FIXTURE = {
  teActionCae1to1: {
    teActionId: 'te_1.1.1.2',
    caeOrigineActionId: 'cae_1.1.2.2.1',
  },
  teActionCaeAndEci: {
    teActionId: 'te_5.1.2.3',
    caeOrigineActionId: 'cae_5.1.2.3',
    eciOrigineActionId: 'eci_1.1.3.3',
  },
} as const;

describe('MigrateCollectiviteDataService', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let createPreSwitchSnapshotsService: CreatePreSwitchSnapshotsService;
  let migrateCollectiviteDataService: MigrateCollectiviteDataService;
  let migrateCollectiviteDataRepository: MigrateCollectiviteDataRepository;
  let collectivite: Collectivite;
  let user: AuthenticatedUser;
  let userId: string;
  let cleanupFixture: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    router = await getTestRouter(app);
    createPreSwitchSnapshotsService = app.get(CreatePreSwitchSnapshotsService);
    migrateCollectiviteDataService = app.get(MigrateCollectiviteDataService);
    migrateCollectiviteDataRepository = app.get(MigrateCollectiviteDataRepository);

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

  async function setupTest() {
    await cleanupCollectiviteReferentielData();
  }

  async function createPreSwitchSnapshots(
    prefs: CollectiviteReferentielPreferences
  ) {
    const result =
      await createPreSwitchSnapshotsService.createPreSwitchSnapshots(
        collectivite.id,
        prefs,
        { user }
      );
    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('createPreSwitchSnapshots a échoué');
    }
    return result.data;
  }

  // migrate() exige désormais une transaction (atomicité des inserts) ; on
  // reproduit ici l'appel dans une tx tel qu'orchestré en prod (PR18)
  async function runMigrate(
    prefs: CollectiviteReferentielPreferences,
    snapshots: ScoreSnapshot[]
  ) {
    return databaseService.db.transaction((tx) =>
      migrateCollectiviteDataService.migrate(collectivite.id, prefs, snapshots, {
        user,
        tx,
      })
    );
  }

  async function migrateFromPrefs(
    prefs: CollectiviteReferentielPreferences,
    preSwitchSnapshots?: ScoreSnapshot[]
  ) {
    const snapshots =
      preSwitchSnapshots ?? (await createPreSwitchSnapshots(prefs));

    return runMigrate(prefs, snapshots);
  }

  async function listTeStatuts() {
    return databaseService.db
      .select()
      .from(actionStatutTable)
      .where(
        and(
          eq(actionStatutTable.collectiviteId, collectivite.id),
          like(actionStatutTable.actionId, 'te_%')
        )
      );
  }

  async function listTeCommentaires() {
    return databaseService.db
      .select()
      .from(actionCommentaireTable)
      .where(
        and(
          eq(actionCommentaireTable.collectiviteId, collectivite.id),
          like(actionCommentaireTable.actionId, 'te_%')
        )
      );
  }

  async function listTePilotes() {
    return databaseService.db
      .select()
      .from(actionPiloteTable)
      .where(
        and(
          eq(actionPiloteTable.collectiviteId, collectivite.id),
          like(actionPiloteTable.actionId, 'te_%')
        )
      );
  }

  async function listTeServices() {
    return databaseService.db
      .select()
      .from(actionServiceTable)
      .where(
        and(
          eq(actionServiceTable.collectiviteId, collectivite.id),
          like(actionServiceTable.actionId, 'te_%')
        )
      );
  }

  async function listTeFicheLinks() {
    return databaseService.db
      .select({
        ficheId: ficheActionActionTable.ficheId,
        actionId: ficheActionActionTable.actionId,
      })
      .from(ficheActionActionTable)
      .innerJoin(
        ficheActionTable,
        eq(ficheActionActionTable.ficheId, ficheActionTable.id)
      )
      .where(
        and(
          eq(ficheActionTable.collectiviteId, collectivite.id),
          like(ficheActionActionTable.actionId, 'te_%')
        )
      );
  }

  test('migration minimale CAE 1→1 : statut et commentaire TE persistés', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId } = MIGRATE_FIXTURE.teActionCae1to1;
    const sourceCommentaire =
      '<p>Explication CAE figée au moment T pour la bascule TE.</p>';

    await setActionStatutForCollectivite(
      router,
      user,
      collectivite.id,
      caeOrigineActionId,
      StatutAvancementEnum.FAIT
    );
    await setActionCommentaireForCollectivite(
      router,
      user,
      collectivite.id,
      caeOrigineActionId,
      sourceCommentaire
    );

    const result = await migrateFromPrefs(prefsEligibleCaeOnly);
    expect(result.success).toBe(true);

    const teStatuts = await listTeStatuts();
    const teCommentaires = await listTeCommentaires();

    expect(teStatuts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: teActionId,
          avancement: StatutAvancementEnum.FAIT,
          concerne: true,
        }),
      ])
    );
    expect(teCommentaires).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: teActionId,
          commentaire: expect.stringContaining(sourceCommentaire),
        }),
      ])
    );
    expect(
      teCommentaires.find((row) => row.actionId === teActionId)?.commentaire.startsWith(
        MERGE_COMMENTAIRES_PREFIX
      )
    ).toBe(true);
  });

  test('source non_concerne : statut TE avec concerne false', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId, eciOrigineActionId } =
      MIGRATE_FIXTURE.teActionCaeAndEci;

    await setActionStatutForCollectivite(
      router,
      user,
      collectivite.id,
      caeOrigineActionId,
      'non_concerne'
    );
    await setActionStatutForCollectivite(
      router,
      user,
      collectivite.id,
      eciOrigineActionId,
      'non_concerne'
    );

    const result = await migrateFromPrefs(prefsEligibleCaeAndEci);
    expect(result.success).toBe(true);

    const teStatut = (await listTeStatuts()).find(
      (row) => row.actionId === teActionId
    );
    expect(teStatut).toEqual(
      expect.objectContaining({
        avancement: StatutAvancementEnum.NON_RENSEIGNE,
        concerne: false,
      })
    );
  });

  test('pilotes + services : lignes TE persistées sur action_pilote / action_service', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCae1to1;
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service fixture migrate' },
    });

    await upsertPilotesOnMesure(router, user, collectivite.id, caeMesureSourceId, [
      { userId },
    ]);
    await upsertServicesOnMesure(router, user, collectivite.id, caeMesureSourceId, [
      serviceTag.id,
    ]);

    const result = await migrateFromPrefs(prefsEligibleCaeOnly);
    expect(result.success).toBe(true);

    const tePilotes = await listTePilotes();
    const teServices = await listTeServices();

    expect(tePilotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: teMesureId,
          userId,
          tagId: null,
        }),
      ])
    );
    expect(teServices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: teMesureId,
          serviceTagId: serviceTag.id,
        }),
      ])
    );
  });

  test('lien fiche mesure CAE : fiche_action_action vers action TE', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teMesureId, caeMesureSourceId } =
      SWITCH_TE_CORRESPONDANCES_FIXTURE.teMesureCae1to1;
    const { ficheId } = await createFicheWithLinkOnAction(
      databaseService,
      collectivite.id,
      caeMesureSourceId
    );

    const result = await migrateFromPrefs(prefsEligibleCaeOnly);
    expect(result.success).toBe(true);

    const teLinks = await listTeFicheLinks();
    expect(teLinks).toEqual(
      expect.arrayContaining([
        {
          ficheId,
          actionId: teMesureId,
        },
      ])
    );
  });

  test('fusion CAE+ECI : statut TE reflète la projection N→1', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId, eciOrigineActionId } =
      MIGRATE_FIXTURE.teActionCaeAndEci;

    await setActionStatutForCollectivite(
      router,
      user,
      collectivite.id,
      caeOrigineActionId,
      StatutAvancementEnum.FAIT
    );
    await setActionStatutForCollectivite(
      router,
      user,
      collectivite.id,
      eciOrigineActionId,
      StatutAvancementEnum.PAS_FAIT
    );

    const result = await migrateFromPrefs(prefsEligibleCaeAndEci);
    expect(result.success).toBe(true);

    const teStatut = (await listTeStatuts()).find(
      (row) => row.actionId === teActionId
    );
    expect(teStatut).toEqual(
      expect.objectContaining({
        avancement: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        avancementDetaille: [0.35, 0, 0.65],
        concerne: true,
      })
    );
  });

  test('TE déjà partiellement peuplé : REFERENTIEL_TE_NOT_EMPTY sans écriture supplémentaire', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId } = MIGRATE_FIXTURE.teActionCae1to1;

    await setActionStatutForCollectivite(
      router,
      user,
      collectivite.id,
      caeOrigineActionId,
      StatutAvancementEnum.FAIT
    );
    const snapshots = await createPreSwitchSnapshots(prefsEligibleCaeOnly);

    await databaseService.db.insert(actionStatutTable).values({
      collectiviteId: collectivite.id,
      actionId: teActionId,
      avancement: StatutAvancementEnum.PAS_FAIT,
      avancementDetaille: [0, 0, 1],
      concerne: true,
      modifiedBy: userId,
    });

    const result = await runMigrate(prefsEligibleCaeOnly, snapshots);

    expect(result).toEqual({
      success: false,
      error: SwitchToTeErrorEnum.REFERENTIEL_TE_NOT_EMPTY,
    });

    const teStatuts = await listTeStatuts();
    expect(teStatuts).toHaveLength(1);
    expect(teStatuts[0]).toEqual(
      expect.objectContaining({
        actionId: teActionId,
        avancement: StatutAvancementEnum.PAS_FAIT,
      })
    );
  });

  test('onConflictDoNothing : insertStatuts conserve la ligne existante', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId } = MIGRATE_FIXTURE.teActionCae1to1;

    await migrateCollectiviteDataRepository.insertStatuts([
      {
        collectiviteId: collectivite.id,
        actionId: teActionId,
        avancement: StatutAvancementEnum.PAS_FAIT,
        avancementDetaille: [0, 0, 1],
        concerne: true,
        modifiedBy: userId,
      },
    ]);

    await migrateCollectiviteDataRepository.insertStatuts([
      {
        collectiviteId: collectivite.id,
        actionId: teActionId,
        avancement: StatutAvancementEnum.FAIT,
        avancementDetaille: [1, 0, 0],
        concerne: true,
        modifiedBy: userId,
      },
    ]);

    const teStatuts = await listTeStatuts();
    expect(teStatuts).toHaveLength(1);
    expect(teStatuts[0]).toEqual(
      expect.objectContaining({
        actionId: teActionId,
        avancement: StatutAvancementEnum.PAS_FAIT,
      })
    );
  });

  test('sans snapshot write : PRE_SWITCH_SNAPSHOT_MISSING avant persistance', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { caeOrigineActionId } = MIGRATE_FIXTURE.teActionCae1to1;
    await setActionStatutForCollectivite(
      router,
      user,
      collectivite.id,
      caeOrigineActionId,
      StatutAvancementEnum.FAIT
    );

    const result = await runMigrate(prefsEligibleCaeOnly, []);

    expect(result).toEqual({
      success: false,
      error: SwitchToTeErrorEnum.PRE_SWITCH_SNAPSHOT_MISSING,
    });

    expect(await listTeStatuts()).toEqual([]);
  });
});
