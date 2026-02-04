import { INestApplication } from '@nestjs/common';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { ReferentielIdEnum, SnapshotJalonEnum } from '@tet/domain/referentiels';
import { eq } from 'drizzle-orm';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { snapshotTable } from '../../snapshots/snapshot.table';
import { addAuditeurPermission } from '../labellisations.test-fixture';

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

    // TODO: créer une nouvelle collectivité
    // TODO: vérifier que l'audit a bien été demandé
    const { audit } = await createAuditWithOnTestFinished({
      databaseService: db,
      collectiviteId: RANDOM_COLLECTIVITE_ID,
      referentielId: ReferentielIdEnum.CAE,
      dateDebut: null,
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
