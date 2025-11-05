import { createAudit } from '@/backend/referentiels/labellisations/labellisations.test-fixture';
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
import { ReferentielIdEnum, SnapshotJalonEnum } from '@/domain/referentiels';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { snapshotTable } from '../../snapshots/snapshot.table';
import { addAuditeurPermission } from '../labellisations.test-fixture';

const RANDOM_COLLECTIVITE_ID = 56;

describe('ValidateAuditRouter', () => {
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

  test('un auditeur peut valider un audit', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { audit } = await createAudit({
      databaseService: db,
      collectiviteId: RANDOM_COLLECTIVITE_ID,
      referentielId: ReferentielIdEnum.CAE,
      withDemande: true,
    });

    await addAuditeurPermission({
      databaseService: db,
      auditId: audit.id,
      userId: yoloDodoUser.id,
    });

    const validatedAudit =
      await caller.referentiels.labellisations.validateAudit({
        auditId: audit.id,
      });

    // On vérifie que l'audit est bien validé
    expect(validatedAudit.dateDebut).not.toBeNull();
    expect(validatedAudit.dateFin).not.toBeNull();
    expect(validatedAudit.valide).toBe(true);
    expect(validatedAudit.clos).toBe(true);

    const snapshot = await db.db
      .select()
      .from(snapshotTable)
      .where(eq(snapshotTable.auditId, validatedAudit.id))
      .then((rows) => rows[0]);

    // On vérifie que le snapshot associé à l'audit est bien créé
    expect(snapshot).toBeDefined();
    expect(snapshot.jalon).toBe(SnapshotJalonEnum.POST_AUDIT);
    expect(snapshot.date).toBe(validatedAudit.dateFin);
  });

  test('un non auditeur ne peut pas valider un audit', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(
      caller.referentiels.labellisations.validateAudit({
        auditId: 456, // random audit id
      })
    ).rejects.toThrow(/Droits insuffisants/i);
  });
});
