import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { OTHER_PDF_SAMPLE_FILE } from '@tet/backend/collectivites/documents/documents.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { createCollectiviteAvecCycle } from '../documents-labellisation.test-fixture';

describe('List Documents Audit Router', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let app: INestApplication;

  let collectivite: Collectivite;
  let visiteurUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const { collectivite: testCollectivite } =
      await addTestCollectiviteAndUsers(db, {
        collectivite: {},
        users: [{ role: CollectiviteRole.EDITION }],
      });
    collectivite = testCollectivite;

    const noAccessUserResult = await addTestUser(db);
    visiteurUser = getAuthUserFromUserCredentials(noAccessUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('un visiteur peut lister les documents d\'un audit', async () => {
    const { audit } = await createAuditWithOnTestFinished({
      databaseService: db,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      withDemande: true,
    });

    const caller = router.createCaller({ user: visiteurUser });

    const documents = await caller.referentiels.documents.listDocumentsAudit({
      auditId: audit.id,
    });

    expect(documents).toBeDefined();
    expect(Array.isArray(documents)).toBe(true);
  });

  test("refuse de lister les documents d'audit d'une collectivite en acces restreint a un utilisateur non membre", async () => {
    const { auditId } = await createCollectiviteAvecCycle({
      db,
      router,
      app,
      accesRestreint: true,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });

    await expect(
      visiteurCaller.referentiels.documents.listDocumentsAudit({ auditId })
    ).rejects.toThrow(
      "Vous n'avez pas les permissions nécessaires pour lister les documents de cet audit."
    );
  });

  test("n'expose pas le document d'une autre collectivite reference par une preuve d'audit", async () => {
    const cycle = await createCollectiviteAvecCycle({
      db,
      router,
      app,
      accesRestreint: false,
    });
    const otherCycle = await createCollectiviteAvecCycle({
      db,
      router,
      app,
      accesRestreint: false,
    });

    await cycle.deposeUnDocumentDAudit({ fileName: 'audit-legitime.pdf' });
    const fichierFromOtherCollectivite = await otherCycle.deposeUnDocumentDAudit({
      fileName: 'audit-autre-collectivite.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
    });

    await db.db.insert(preuveAuditTable).values([
      {
        collectiviteId: cycle.collectiviteId,
        auditId: cycle.auditId,
        fichierId: fichierFromOtherCollectivite.id,
        commentaire: '',
        modifiedBy: cycle.membreId,
      },
      {
        collectiviteId: otherCycle.collectiviteId,
        auditId: cycle.auditId,
        fichierId: fichierFromOtherCollectivite.id,
        commentaire: '',
        modifiedBy: otherCycle.membreId,
      },
    ]);

    const documents =
      await cycle.membreCaller.referentiels.documents.listDocumentsAudit({
        auditId: cycle.auditId,
      });

    const filenames = documents.map((document) => document.fichier?.filename);
    expect(filenames).toContain('audit-legitime.pdf');
    expect(filenames).not.toContain('audit-autre-collectivite.pdf');
  });

  test("masque les documents d'audit confidentiels a un utilisateur non membre", async () => {
    const { auditId, membreCaller, deposeUnDocumentDAudit } =
      await createCollectiviteAvecCycle({
        db,
        router,
        app,
        accesRestreint: false,
      });

    await deposeUnDocumentDAudit({ fileName: 'audit-public.pdf' });
    await deposeUnDocumentDAudit({
      fileName: 'audit-confidentiel.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
      confidentiel: true,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documentsVisiteur =
      await visiteurCaller.referentiels.documents.listDocumentsAudit({
        auditId,
      });

    expect(
      documentsVisiteur.map((document) => document.fichier?.filename)
    ).toEqual(['audit-public.pdf']);

    const documentsMembre =
      await membreCaller.referentiels.documents.listDocumentsAudit({ auditId });

    expect(
      documentsMembre.map((document) => document.fichier?.filename)
    ).toEqual(['audit-public.pdf', 'audit-confidentiel.pdf']);
  });
});
