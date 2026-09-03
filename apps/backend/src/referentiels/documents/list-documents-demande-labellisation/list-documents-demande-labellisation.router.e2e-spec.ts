import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { OTHER_PDF_SAMPLE_FILE } from '@tet/backend/collectivites/documents/documents.test-fixture';
import {
  createTRPCClientFromCaller,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  signInWith,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import { createTestDemandePreuve } from '../../labellisations/create-preuve/create-preuve.test-fixture';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { createCollectiviteAvecCycle } from '../documents-labellisation.test-fixture';

describe('List Documents Demande Labellisation Router', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let app: INestApplication;

  let collectivite: Collectivite;
  let editeurUser: AuthenticatedUser;
  let visiteurUser: AuthenticatedUser;
  let editeurAuthToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      db,
      {
        collectivite: {},
        users: [{ role: CollectiviteRole.EDITION }],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    const editeur = testCollectiviteAndUsersResult.users[0];
    const editeurUserSignInResponse = await signInWith({
      email: editeur.email,
      password: editeur.password,
    });
    editeurAuthToken =
      editeurUserSignInResponse.data.session?.access_token ?? '';
    editeurUser = getAuthUserFromUserCredentials(editeur);

    const noAccessUserResult = await addTestUser(db);
    visiteurUser = getAuthUserFromUserCredentials(noAccessUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test("un visiteur peut lister les documents d'une demande", async () => {
    const { demande } = await createAuditWithOnTestFinished({
      databaseService: db,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      withDemande: true,
      dateDebut: null,
    });
    expect(demande).toBeDefined();

    const editeurCaller = router.createCaller({ user: editeurUser });
    await createTestDemandePreuve(
      createTRPCClientFromCaller(editeurCaller),
      request(app.getHttpServer()),
      editeurAuthToken,
      collectivite.id,
      ReferentielIdEnum.CAE
    );

    const visiteurCaller = router.createCaller({ user: visiteurUser });

    const documents =
      await visiteurCaller.referentiels.documents.listDocumentsDemandeLabellisation(
        { demandeId: demande?.id ?? 0 }
      );

    expect(documents).toBeDefined();
    expect(Array.isArray(documents)).toBe(true);
    expect(documents.length).toBe(1);
  });

  test("refuse de lister les documents d'une collectivite en acces restreint a un utilisateur non membre", async () => {
    const { demandeId, deposeUnDocumentDeDemande } =
      await createCollectiviteAvecCycle({
        db,
        router,
        app,
        accesRestreint: true,
      });
    await deposeUnDocumentDeDemande();

    const visiteurCaller = router.createCaller({ user: visiteurUser });

    await expect(
      visiteurCaller.referentiels.documents.listDocumentsDemandeLabellisation({
        demandeId,
      })
    ).rejects.toThrow(
      "Vous n'avez pas les permissions nécessaires pour lister les documents de cette demande."
    );
  });

  test('masque les documents confidentiels a un utilisateur non membre', async () => {
    const { demandeId, membreCaller, deposeUnDocumentDeDemande } =
      await createCollectiviteAvecCycle({
        db,
        router,
        app,
        accesRestreint: false,
      });

    await deposeUnDocumentDeDemande({ fileName: 'preuve-publique.pdf' });
    await deposeUnDocumentDeDemande({
      fileName: 'preuve-confidentielle.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
      confidentiel: true,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documentsVisiteur =
      await visiteurCaller.referentiels.documents.listDocumentsDemandeLabellisation(
        { demandeId }
      );

    expect(
      documentsVisiteur.map((document) => document.fichier?.filename)
    ).toEqual(['preuve-publique.pdf']);

    const documentsMembre =
      await membreCaller.referentiels.documents.listDocumentsDemandeLabellisation(
        { demandeId }
      );

    expect(
      documentsMembre.map((document) => document.fichier?.filename)
    ).toEqual(['preuve-publique.pdf', 'preuve-confidentielle.pdf']);
  });
});
