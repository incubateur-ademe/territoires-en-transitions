import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  deleteAllDocuments,
  uploadCreateTestDocument,
} from '@tet/backend/collectivites/documents/documents.test-fixture';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../../test/app-utils';

describe('UpdateDocumentRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let readerUser: AuthenticatedUser;
  let nonMembreUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          { role: CollectiviteRole.EDITION },
          { role: CollectiviteRole.LECTURE },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    editorUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[0]
    );
    readerUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[1]
    );

    const noAccessUserResult = await addTestUser(databaseService);
    nonMembreUser = getAuthUserFromUserCredentials(noAccessUserResult.user);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await deleteAllDocuments({
      databaseService,
      collectiviteId: collectivite.id,
    });
  });

  test('lecture user cannot update a document', async () => {
    const caller = router.createCaller({ user: readerUser });

    await expect(() =>
      caller.collectivites.documents.update({
        collectiviteId: collectivite.id,
        hash: 'a'.repeat(64),
        filename: 'x.pdf',
      })
    ).rejects.toThrow(/Vous n'avez pas les permissions nécessaires/i);
  });

  test('passer un document en confidentiel le retire du champ du non membre', async () => {
    const document = await uploadCreateTestDocument({
      app,
      collectiviteId: collectivite.id,
      fileName: 'original.pdf',
    });
    const nonMembreCaller = router.createCaller({ user: nonMembreUser });

    await expect(
      nonMembreCaller.collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        fichierId: document.id,
      })
    ).resolves.toEqual({
      signedUrl: expect.stringContaining(document.hash),
      filename: 'original.pdf',
    });

    const updated = await router
      .createCaller({ user: editorUser })
      .collectivites.documents.update({
        collectiviteId: collectivite.id,
        hash: document.hash,
        confidentiel: true,
      });
    expect(updated.confidentiel).toBe(true);

    await expect(() =>
      nonMembreCaller.collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        fichierId: document.id,
      })
    ).rejects.toThrowError(/n'existe pas/i);
  });

  test("le nouveau nom du document accompagne l'url signee", async () => {
    const document = await uploadCreateTestDocument({
      app,
      collectiviteId: collectivite.id,
      fileName: 'original.pdf',
    });
    const caller = router.createCaller({ user: editorUser });

    const updated = await caller.collectivites.documents.update({
      collectiviteId: collectivite.id,
      hash: document.hash,
      filename: 'updated-name.pdf',
    });
    expect(updated.filename).toBe('updated-name.pdf');

    await expect(
      caller.collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        fichierId: document.id,
      })
    ).resolves.toEqual({
      signedUrl: expect.stringContaining(document.hash),
      filename: 'updated-name.pdf',
    });
  });
});
