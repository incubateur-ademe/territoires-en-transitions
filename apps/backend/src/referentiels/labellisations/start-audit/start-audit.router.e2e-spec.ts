import { ReferentielIdEnum } from '@/backend/referentiels/models/referentiel-id.enum';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SnapshotJalonEnum } from '../../snapshots/snapshot-jalon.enum';
import { snapshotTable } from '../../snapshots/snapshot.table';
import {
  addAuditeurPermission,
  createAudit,
} from '../labellisations.test-fixture';

const RANDOM_COLLECTIVITE_ID = 19;

describe('StartAuditRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    yoloDodoUser = await getAuthUser(YOLO_DODO);
  });

  afterAll(async () => {
    await app.close();
  });

  test('un auditeur peut lancer un audit', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { audit } = await createAudit({
      databaseService: db,
      collectiviteId: RANDOM_COLLECTIVITE_ID,
      referentielId: ReferentielIdEnum.CAE,
      withDemande: true,
    });

    addAuditeurPermission({
      databaseService: db,
      auditId: audit.id,
      userId: yoloDodoUser.id,
    });

    const startedAudit = await caller.referentiels.labellisations.startAudit({
      auditId: audit.id,
    });

    // On vérifie que l'audit est bien demarré
    expect(startedAudit).toBeDefined();
    expect(startedAudit.dateDebut).toBeDefined();
    expect(startedAudit.dateDebut).not.toBeNull();
    expect(startedAudit.dateFin).toBeNull();
    expect(startedAudit.clos).toBe(false);

    const snapshot = await db.db
      .select()
      .from(snapshotTable)
      .where(eq(snapshotTable.auditId, startedAudit.id))
      .then((rows) => rows[0]);

    // On vérifie que le snapshot associé à l'audit est bien créé
    expect(snapshot).toBeDefined();
    expect(snapshot.jalon).toBe(SnapshotJalonEnum.PRE_AUDIT);
    expect(snapshot.date).toBe(startedAudit.dateDebut);

    // Delete snapshot is not needed, it will be deleted by the cascade
  });

  test("un non auditeur ne peut pas lancer d'audit", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(
      caller.referentiels.labellisations.startAudit({
        auditId: 456, // random audit id
      })
    ).rejects.toThrow(/Droits insuffisants/i);
  });
});
