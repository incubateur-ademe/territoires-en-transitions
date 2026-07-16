import { INestApplication } from '@nestjs/common';
import {
  addTestCollectiviteAndUsers,
  setCollectiviteAsCOT,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { createAudit } from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import { actionStatutTable } from '@tet/backend/referentiels/models/action-statut.table';
import { snapshotTable } from '@tet/backend/referentiels/snapshots/snapshot.table';
import { SNAPSHOTS } from '@tet/backend/referentiels/snapshots/snapshots.constants';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  Collectivite,
  type CollectivitePreferences,
  type CollectiviteReferentielPreferences,
} from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import {
  cleanupSwitchToTeCollectiviteReferentielData,
  prefsEligibleCaeAndEci,
  prefsEligibleCaeOnly,
  setActionStatutForCollectivite,
} from './switch-to-te-context.test-fixture';
import { switchToTeTrpcErrorEntries } from './switch-to-te.errors';

describe('SwitchToTeRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let supportCaller: ReturnType<TrpcRouter['createCaller']>;
  let adminUser: AuthenticatedUser;
  let lectureUser: AuthenticatedUser;
  let collectivite: Collectivite;
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

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          { role: CollectiviteRole.ADMIN },
          { role: CollectiviteRole.LECTURE },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    adminUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[0]
    );
    lectureUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[1]
    );
  });

  afterAll(async () => {
    await cleanupSuperAdminMode();
    await cleanupSupportUser();
    await app.close();
  });

  async function setReferentielPreferences(
    referentiels: CollectiviteReferentielPreferences
  ) {
    await supportCaller.collectivites.preferences.update({
      collectiviteId: collectivite.id,
      preferences: { referentiels },
    });
  }

  // crée une collectivité éligible avec ses préférences et retourne le caller
  // admin et l'utilisateur admin associé
  async function setupEligibleCollectivite(
    referentiels: CollectiviteReferentielPreferences
  ) {
    const fixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [{ role: CollectiviteRole.ADMIN }],
    });
    onTestFinished(() => fixture.cleanup());

    await supportCaller.collectivites.preferences.update({
      collectiviteId: fixture.collectivite.id,
      preferences: { referentiels },
    });

    const fixtureAdminUser = getAuthUserFromUserCredentials(fixture.users[0]);
    const adminCaller = router.createCaller({ user: fixtureAdminUser });

    return {
      collectiviteId: fixture.collectivite.id,
      adminCaller,
      fixtureAdminUser,
    };
  }

  // ── helpers DB ──────────────────────────────────────────────────────────────

  async function getCollectivitePreferences(
    collectiviteId: number
  ): Promise<CollectivitePreferences | null> {
    const [row] = await databaseService.db
      .select({ preferences: collectiviteTable.preferences })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId));
    return (row?.preferences as CollectivitePreferences | null) ?? null;
  }

  async function getSnapshots(collectiviteId: number, refs: string[]) {
    return databaseService.db
      .select({
        ref: snapshotTable.ref,
        nom: snapshotTable.nom,
        referentielId: snapshotTable.referentielId,
        jalon: snapshotTable.jalon,
      })
      .from(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, collectiviteId),
          inArray(snapshotTable.ref, refs)
        )
      );
  }

  // ── Guards ──────────────────────────────────────────────────────────────────

  test('refuse si la bascule a déjà été effectuée', async () => {
    const switchedFixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [{ role: CollectiviteRole.ADMIN }],
    });
    onTestFinished(() => switchedFixture.cleanup());
    const switchedAdminUser = getAuthUserFromUserCredentials(
      switchedFixture.users[0]
    );

    await supportCaller.collectivites.preferences.update({
      collectiviteId: switchedFixture.collectivite.id,
      preferences: {
        referentiels: {
          cae: { display: false, mode: 'archived' },
          eci: { display: false, mode: 'archived' },
          te: {
            display: true,
            mode: 'write',
            populatedFromCaeEci: {
              populatedAt: '2026-06-01T00:00:00.000Z',
              populatedBy: switchedAdminUser.id,
            },
          },
        },
      },
    });

    const adminCaller = router.createCaller({ user: switchedAdminUser });

    await expect(
      adminCaller.referentiels.switchToTe({
        collectiviteId: switchedFixture.collectivite.id,
      })
    ).rejects.toThrow(switchToTeTrpcErrorEntries.ALREADY_SWITCHED.message);
  });

  test('refuse une CT non engagée (TE en write)', async () => {
    await setReferentielPreferences({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });

    const adminCaller = router.createCaller({ user: adminUser });

    await expect(
      adminCaller.referentiels.switchToTe({ collectiviteId: collectivite.id })
    ).rejects.toThrow(switchToTeTrpcErrorEntries.NOT_ELIGIBLE.message);
  });

  test('refuse quand TE readonly mais aucune source CAE/ECI engagée', async () => {
    await setReferentielPreferences({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });

    const adminCaller = router.createCaller({ user: adminUser });

    await expect(
      adminCaller.referentiels.switchToTe({ collectiviteId: collectivite.id })
    ).rejects.toThrow(switchToTeTrpcErrorEntries.NOT_ELIGIBLE.message);
  });

  test('refuse sans permission REFERENTIELS.MUTATE', async () => {
    await setReferentielPreferences({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });

    const lectureCaller = router.createCaller({ user: lectureUser });

    await expect(
      lectureCaller.referentiels.switchToTe({ collectiviteId: collectivite.id })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });

  test('bloque quand un COT est actif (cae write)', async () => {
    const { collectiviteId, adminCaller } = await setupEligibleCollectivite({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });
    await setCollectiviteAsCOT(databaseService, collectiviteId, true);

    await expect(
      adminCaller.referentiels.switchToTe({ collectiviteId })
    ).rejects.toThrow(switchToTeTrpcErrorEntries.COT_ACTIVE.message);
  });

  test('bloque quand un audit est en cours (cae write)', async () => {
    const { collectiviteId, adminCaller } = await setupEligibleCollectivite({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });
    const { cleanup } = await createAudit({
      databaseService,
      collectiviteId,
      referentielId: 'cae',
      dateDebut: new Date('2025-01-01').toISOString(),
      valide: false,
      clos: false,
    });
    onTestFinished(() => cleanup());

    await expect(
      adminCaller.referentiels.switchToTe({ collectiviteId })
    ).rejects.toThrow(switchToTeTrpcErrorEntries.AUDIT_IN_PROGRESS.message);
  });

  test("bloque quand une demande d'audit est en cours (cae write)", async () => {
    const { collectiviteId, adminCaller } = await setupEligibleCollectivite({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });
    const { cleanup } = await createAudit({
      databaseService,
      collectiviteId,
      referentielId: 'cae',
      dateDebut: null,
      valide: false,
      clos: false,
      withDemande: true,
    });
    onTestFinished(() => cleanup());

    await expect(
      adminCaller.referentiels.switchToTe({ collectiviteId })
    ).rejects.toThrow(
      switchToTeTrpcErrorEntries.AUDIT_REQUEST_IN_PROGRESS.message
    );
  });

  test('bascule réussit quand les guards passent (CAE write)', async () => {
    const { collectiviteId, adminCaller } = await setupEligibleCollectivite(
      prefsEligibleCaeOnly
    );
    onTestFinished(() =>
      cleanupSwitchToTeCollectiviteReferentielData(
        databaseService,
        collectiviteId
      )
    );

    const result = await adminCaller.referentiels.switchToTe({
      collectiviteId,
    });

    expect(result.status).toBe('switched');
    expect(result.populatedAt).toBeDefined();
  });

  test("ne bloque pas quand l'audit est validé et clos — bascule réussit", async () => {
    const { collectiviteId, adminCaller } = await setupEligibleCollectivite({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });
    onTestFinished(() =>
      cleanupSwitchToTeCollectiviteReferentielData(
        databaseService,
        collectiviteId
      )
    );
    const { cleanup } = await createAudit({
      databaseService,
      collectiviteId,
      referentielId: 'cae',
      dateDebut: new Date('2025-01-01').toISOString(),
      valide: true,
      clos: true,
      withDemande: true,
    });
    onTestFinished(() => cleanup());

    const result = await adminCaller.referentiels.switchToTe({
      collectiviteId,
    });

    expect(result.status).toBe('switched');
  });

  test('ignore un audit en cours sur un référentiel archived — bascule réussit', async () => {
    const { collectiviteId, adminCaller } = await setupEligibleCollectivite({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
    onTestFinished(() =>
      cleanupSwitchToTeCollectiviteReferentielData(
        databaseService,
        collectiviteId
      )
    );
    const { cleanup } = await createAudit({
      databaseService,
      collectiviteId,
      referentielId: 'cae',
      dateDebut: new Date('2025-01-01').toISOString(),
      valide: false,
      clos: false,
    });
    onTestFinished(() => cleanup());

    const result = await adminCaller.referentiels.switchToTe({
      collectiviteId,
    });

    expect(result.status).toBe('switched');
  });

  // ── Bascule complète ────────────────────────────────────────────────────────

  describe('bascule nominale CAE seul', () => {
    test('crée snapshot pre-switch-te + post-switch-te et met à jour les prefs', async () => {
      const { collectiviteId, adminCaller } = await setupEligibleCollectivite(
        prefsEligibleCaeOnly
      );
      onTestFinished(() =>
        cleanupSwitchToTeCollectiviteReferentielData(
          databaseService,
          collectiviteId
        )
      );

      const result = await adminCaller.referentiels.switchToTe({
        collectiviteId,
      });

      expect(result.status).toBe('switched');
      expect(result.populatedAt).toBeDefined();

      // snapshots attendus
      const snapshots = await getSnapshots(collectiviteId, [
        SNAPSHOTS.PRE_SWITCH_TE_REF,
        SNAPSHOTS.POST_SWITCH_TE_REF,
        SNAPSHOTS.SCORE_COURANT_REF,
      ]);

      const preSwitch = snapshots.find(
        (s) => s.ref === SNAPSHOTS.PRE_SWITCH_TE_REF
      );
      const postSwitch = snapshots.find(
        (s) => s.ref === SNAPSHOTS.POST_SWITCH_TE_REF
      );
      const scoreCourant = snapshots.find(
        (s) => s.ref === SNAPSHOTS.SCORE_COURANT_REF
      );

      expect(preSwitch).toBeDefined();
      expect(preSwitch?.referentielId).toBe('cae');
      expect(preSwitch?.nom).toBe(SNAPSHOTS.PRE_SWITCH_TE_NOM);

      expect(postSwitch).toBeDefined();
      expect(postSwitch?.referentielId).toBe('te');
      expect(postSwitch?.nom).toBe(SNAPSHOTS.POST_SWITCH_TE_NOM);

      expect(scoreCourant).toBeDefined();
      expect(scoreCourant?.referentielId).toBe('te');

      // prefs post-bascule
      const prefs = await getCollectivitePreferences(collectiviteId);
      const refs = prefs?.referentiels;

      expect(refs?.cae.mode).toBe('archived');
      expect(refs?.cae.display).toBe(false);
      expect(refs?.eci.mode).toBe('archived');
      expect(refs?.te.mode).toBe('write');
      expect(refs?.te.display).toBe(true);
      expect(refs?.te.populatedFromCaeEci?.populatedAt).toBe(
        result.populatedAt
      );
    });
  });

  describe('fusion CAE+ECI', () => {
    test('crée 2 snapshots pre-switch-te (cae+eci) et archive les deux sources', async () => {
      const { collectiviteId, adminCaller } = await setupEligibleCollectivite(
        prefsEligibleCaeAndEci
      );
      onTestFinished(() =>
        cleanupSwitchToTeCollectiviteReferentielData(
          databaseService,
          collectiviteId
        )
      );

      const result = await adminCaller.referentiels.switchToTe({
        collectiviteId,
      });

      expect(result.status).toBe('switched');

      // 2 snapshots pre-switch-te : un par source en write
      const preSwitchSnapshots = await databaseService.db
        .select({
          ref: snapshotTable.ref,
          referentielId: snapshotTable.referentielId,
        })
        .from(snapshotTable)
        .where(
          and(
            eq(snapshotTable.collectiviteId, collectiviteId),
            eq(snapshotTable.ref, SNAPSHOTS.PRE_SWITCH_TE_REF)
          )
        );

      const referentielIds = preSwitchSnapshots.map((s) => s.referentielId);
      expect(referentielIds).toContain('cae');
      expect(referentielIds).toContain('eci');

      // cae et eci archivés, te en write
      const prefs = await getCollectivitePreferences(collectiviteId);
      expect(prefs?.referentiels.cae.mode).toBe('archived');
      expect(prefs?.referentiels.eci.mode).toBe('archived');
      expect(prefs?.referentiels.te.mode).toBe('write');
    });
  });

  describe('idempotence', () => {
    test('rejouer switchToTe après succès retourne ALREADY_SWITCHED', async () => {
      const { collectiviteId, adminCaller } = await setupEligibleCollectivite(
        prefsEligibleCaeOnly
      );
      onTestFinished(() =>
        cleanupSwitchToTeCollectiviteReferentielData(
          databaseService,
          collectiviteId
        )
      );

      // 1re bascule
      const first = await adminCaller.referentiels.switchToTe({
        collectiviteId,
      });
      expect(first.status).toBe('switched');

      // 2e appel → ALREADY_SWITCHED
      await expect(
        adminCaller.referentiels.switchToTe({ collectiviteId })
      ).rejects.toThrow(switchToTeTrpcErrorEntries.ALREADY_SWITCHED.message);
    });
  });

  describe('rollback', () => {
    test('rollback complet si TE déjà peuplé (REFERENTIEL_TE_NOT_EMPTY)', async () => {
      const { collectiviteId, adminCaller, fixtureAdminUser } =
        await setupEligibleCollectivite(prefsEligibleCaeOnly);
      onTestFinished(() =>
        cleanupSwitchToTeCollectiviteReferentielData(
          databaseService,
          collectiviteId
        )
      );

      // simule TE déjà peuplé : insère un statut te_* directement en DB
      await databaseService.db
        .insert(actionStatutTable)
        .values({
          collectiviteId,
          actionId: 'te_1.1',
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
          concerne: true,
          modifiedBy: fixtureAdminUser.id,
        })
        .onConflictDoNothing();

      await expect(
        adminCaller.referentiels.switchToTe({ collectiviteId })
      ).rejects.toThrow(
        switchToTeTrpcErrorEntries.REFERENTIEL_TE_NOT_EMPTY.message
      );

      // aucun snapshot pre-switch-te créé (rollback total)
      const snapshots = await getSnapshots(collectiviteId, [
        SNAPSHOTS.PRE_SWITCH_TE_REF,
      ]);
      expect(snapshots).toHaveLength(0);

      // prefs inchangées (cae toujours write, populatedFromCaeEci absent)
      const prefs = await getCollectivitePreferences(collectiviteId);
      expect(prefs?.referentiels.cae.mode).toBe('write');
      expect(prefs?.referentiels.te.populatedFromCaeEci).toBeUndefined();
    });
  });

  describe('bascule avec données migrées', () => {
    test('migre un statut CAE → mesure TE et le retrouve après bascule', async () => {
      const { collectiviteId, adminCaller, fixtureAdminUser } =
        await setupEligibleCollectivite(prefsEligibleCaeOnly);
      onTestFinished(() =>
        cleanupSwitchToTeCollectiviteReferentielData(
          databaseService,
          collectiviteId
        )
      );

      // pose un statut sur une mesure CAE qui a une correspondance TE
      await setActionStatutForCollectivite(
        router,
        fixtureAdminUser,
        collectiviteId,
        'cae_1.1.2.2.1',
        'fait'
      );

      const result = await adminCaller.referentiels.switchToTe({
        collectiviteId,
      });
      expect(result.status).toBe('switched');

      // vérifie que le statut TE correspondant (te_1.1.1.2) a été migré
      const teStatuts = await databaseService.db
        .select({ actionId: actionStatutTable.actionId })
        .from(actionStatutTable)
        .where(
          and(
            eq(actionStatutTable.collectiviteId, collectiviteId),
            eq(actionStatutTable.actionId, 'te_1.1.1.2')
          )
        );

      expect(teStatuts.length).toBeGreaterThan(0);
    });
  });
});
