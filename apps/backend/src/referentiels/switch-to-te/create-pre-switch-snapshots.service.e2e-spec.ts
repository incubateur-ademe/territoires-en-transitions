import { INestApplication } from '@nestjs/common';
import { snapshotTable } from '@tet/backend/referentiels/snapshots/snapshot.table';
import { SNAPSHOTS } from '@tet/backend/referentiels/snapshots/snapshots.constants';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ReferentielIdEnum, SnapshotJalonEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { CreatePreSwitchSnapshotsService } from './create-pre-switch-snapshots.service';
import {
  prefsEligibleCaeAndEci,
  prefsEligibleCaeOnly,
} from './switch-to-te-context.test-fixture';

// collectivité seedée avec des données CAE réelles
const COLLECTIVITE_ID = 1;

describe('CreatePreSwitchSnapshotsService', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let service: CreatePreSwitchSnapshotsService;
  let user: AuthenticatedUser;
  let cleanupUser: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    service = app.get(CreatePreSwitchSnapshotsService);

    const userResult = await addTestUser(databaseService, {
      collectiviteId: COLLECTIVITE_ID,
      role: CollectiviteRole.ADMIN,
    });
    cleanupUser = userResult.cleanup;
    user = getAuthUserFromUserCredentials(userResult.user);
  });

  afterAll(async () => {
    await cleanupUser();
    await app.close();
  });

  // supprime les snapshots pré-bascule créés sur la collectivité seedée
  async function cleanupPreSwitchSnapshots() {
    await databaseService.db
      .delete(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, COLLECTIVITE_ID),
          eq(snapshotTable.ref, SNAPSHOTS.PRE_SWITCH_TE_REF)
        )
      );
  }

  test('CAE seul en write : 1 snapshot pré-bascule figé', async () => {
    onTestFinished(cleanupPreSwitchSnapshots);

    const result = await service.createPreSwitchSnapshots(
      COLLECTIVITE_ID,
      prefsEligibleCaeOnly,
      { user }
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toHaveLength(1);
    const [snapshot] = result.data;
    expect(snapshot.referentielId).toBe(ReferentielIdEnum.CAE);
    expect(snapshot.ref).toBe(SNAPSHOTS.PRE_SWITCH_TE_REF);
    expect(snapshot.nom).toBe(SNAPSHOTS.PRE_SWITCH_TE_NOM);
    expect(snapshot.jalon).toBe(SnapshotJalonEnum.PRE_SWITCH_TE);
    expect(snapshot.scoresPayload).toBeDefined();
    expect(snapshot.scoresPayload.scores).toBeDefined();
    expect(snapshot.personnalisationReponses).toBeDefined();
  });

  test('CAE + ECI en write : 2 snapshots (cae puis eci)', async () => {
    onTestFinished(cleanupPreSwitchSnapshots);

    const result = await service.createPreSwitchSnapshots(
      COLLECTIVITE_ID,
      prefsEligibleCaeAndEci,
      { user }
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toHaveLength(2);
    // ordre déterministe : cae puis eci
    expect(result.data.map((snapshot) => snapshot.referentielId)).toEqual([
      ReferentielIdEnum.CAE,
      ReferentielIdEnum.ECI,
    ]);
  });

  test('ECI hors write : aucun snapshot eci en base', async () => {
    onTestFinished(cleanupPreSwitchSnapshots);

    await service.createPreSwitchSnapshots(
      COLLECTIVITE_ID,
      prefsEligibleCaeOnly,
      { user }
    );

    const eciSnapshots = await databaseService.db
      .select()
      .from(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, COLLECTIVITE_ID),
          eq(snapshotTable.referentielId, ReferentielIdEnum.ECI),
          eq(snapshotTable.ref, SNAPSHOTS.PRE_SWITCH_TE_REF)
        )
      );

    expect(eciSnapshots).toHaveLength(0);
  });

  test('idempotence : 2 appels → 1 ligne, modifiedAt mis à jour', async () => {
    onTestFinished(cleanupPreSwitchSnapshots);

    const firstResult = await service.createPreSwitchSnapshots(
      COLLECTIVITE_ID,
      prefsEligibleCaeOnly,
      { user }
    );
    expect(firstResult.success).toBe(true);
    if (!firstResult.success) return;

    const secondResult = await service.createPreSwitchSnapshots(
      COLLECTIVITE_ID,
      prefsEligibleCaeOnly,
      { user }
    );
    expect(secondResult.success).toBe(true);
    if (!secondResult.success) return;

    const rows = await databaseService.db
      .select()
      .from(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, COLLECTIVITE_ID),
          eq(snapshotTable.referentielId, ReferentielIdEnum.CAE),
          eq(snapshotTable.ref, SNAPSHOTS.PRE_SWITCH_TE_REF)
        )
      );

    // une seule ligne par (collectivite_id, referentiel_id, ref)
    expect(rows).toHaveLength(1);

    const firstModifiedAt = new Date(firstResult.data[0].modifiedAt).getTime();
    const secondModifiedAt = new Date(
      secondResult.data[0].modifiedAt
    ).getTime();
    expect(secondModifiedAt).toBeGreaterThanOrEqual(firstModifiedAt);
  });
});
