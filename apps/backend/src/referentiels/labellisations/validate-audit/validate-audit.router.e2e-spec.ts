import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createAuditWithOnTestFinished } from '@tet/backend/referentiels/referentiels.test-fixture';

import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum, SnapshotJalonEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { snapshotTable } from '../../snapshots/snapshot.table';
import { addAuditeurPermission } from '../labellisations.test-fixture';

describe('ValidateAuditRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    yoloDodoUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('un auditeur peut valider un audit', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { audit } = await createAuditWithOnTestFinished({
      databaseService: db,
      collectiviteId: collectivite.id,
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
