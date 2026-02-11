import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum, SnapshotJalonEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { snapshotTable } from '../../snapshots/snapshot.table';
import { cleanupReferentielActionStatutsAndLabellisations } from '../../update-action-statut/referentiel-action-statut.test-fixture';
import { addAuditeurPermission } from '../labellisations.test-fixture';

const RANDOM_COLLECTIVITE_ID = 19;

describe('StartAuditRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;
  let lectureUser: AuthenticatedUser;
  let editionUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      db,
      {
        collectivite: {
          isCOT: true,
        },
        users: [
          {
            accessLevel: CollectiviteRole.LECTURE,
          },
          {
            accessLevel: CollectiviteRole.EDITION,
          },
        ],
      }
    );
    collectivite = testCollectiviteAndUsersResult.collectivite;
    const lectureUserFixture = testCollectiviteAndUsersResult.users[0];
    lectureUser = getAuthUserFromDcp(lectureUserFixture);
    const editionUserFixture = testCollectiviteAndUsersResult.users[1];
    editionUser = getAuthUserFromDcp(editionUserFixture);

    yoloDodoUser = await getAuthUser(YOLO_DODO);

    return async () => {
      await cleanupReferentielActionStatutsAndLabellisations(
        db,
        collectivite.id
      );

      await testCollectiviteAndUsersResult.cleanup();

      if (app) {
        await app.close();
      }
    };
  });

  beforeEach(async () => {
    await cleanupReferentielActionStatutsAndLabellisations(db, collectivite.id);
  });

  test('un auditeur peut lancer un audit', async () => {
    const { audit } = await createAuditWithOnTestFinished({
      databaseService: db,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      dateDebut: null,
      withDemande: true,
    });

    await addAuditeurPermission({
      databaseService: db,
      auditId: audit.id,
      userId: lectureUser.id,
    });

    const caller = router.createCaller({ user: lectureUser });

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

  test('On ne peut pas lancer un audit déjà démarré', async () => {
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
      userId: lectureUser.id,
    });

    await expect(
      caller.referentiels.labellisations.startAudit({
        auditId: audit.id,
      })
    ).rejects.toThrow(/Vous n'avez pas les permissions nécessaires/i);
  });

  test("un visiteur ne peut pas lancer d'audit", async () => {
    const { audit } = await createAuditWithOnTestFinished({
      databaseService: db,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      dateDebut: null,
      withDemande: true,
    });

    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(
      caller.referentiels.labellisations.startAudit({
        auditId: audit.id,
      })
    ).rejects.toThrow(/Vous n'avez pas les permissions nécessaires/i);
  });

  test("un editeur ne peut pas lancer d'audit", async () => {
    const { audit } = await createAuditWithOnTestFinished({
      databaseService: db,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      dateDebut: null,
      withDemande: true,
    });

    const caller = router.createCaller({ user: editionUser });

    await expect(
      caller.referentiels.labellisations.startAudit({
        auditId: audit.id,
      })
    ).rejects.toThrow(/Vous n'avez pas les permissions nécessaires/i);
  });
});
