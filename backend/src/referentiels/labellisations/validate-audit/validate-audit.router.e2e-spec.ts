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
import { auditTable } from '../audit.table';
import { auditeurTable } from '../auditeur.table';
import { labellisationDemandeTable } from '../labellisation-demande.table';

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.edition;

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

    // Create demande
    const demande = await db.db
      .insert(labellisationDemandeTable)
      .values({
        collectiviteId: COLLECTIVITE_ID,
        referentiel: ReferentielIdEnum.CAE,
        enCours: false,
        sujet: 'cot',
        date: new Date().toISOString(),
      })
      .returning()
      .then((rows) => rows[0]);

    // Create associated audit
    const audit = await db.db
      .insert(auditTable)
      .values({
        collectiviteId: COLLECTIVITE_ID,
        referentielId: ReferentielIdEnum.CAE,
        demandeId: demande.id,
        dateDebut: new Date('2024-02-02').toISOString(),
      })
      .returning()
      .then((rows) => rows[0]);

    // Add auditeur
    await db.db.insert(auditeurTable).values({
      auditId: audit.id,
      auditeur: yoloDodoUser.id,
    });

    onTestFinished(async () => {
      // Delete auditeur
      await db.db
        .delete(auditeurTable)
        .where(eq(auditeurTable.auditId, audit.id));
      // Delete audit
      await db.db.delete(auditTable).where(eq(auditTable.id, audit.id));
      // Delete demande
      await db.db
        .delete(labellisationDemandeTable)
        .where(eq(labellisationDemandeTable.id, demande.id));
      // Delete snapshot is not needed, it will be deleted by the cascade
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
