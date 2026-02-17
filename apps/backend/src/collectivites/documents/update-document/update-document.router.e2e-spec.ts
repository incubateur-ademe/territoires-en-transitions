import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  deleteAllDocuments,
  uploadCreateTestDocument,
} from '@tet/backend/collectivites/documents/documents.test-fixture';
import { getAuthUserFromDcp, signInWith, YOLO_DODO } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../../test/app-utils';

const TEST_USER_PASSWORD = 'yolododo';

describe('UpdateDocumentRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let readerUser: AuthenticatedUser;
  let editorToken: string;
  let visiteurToken: string;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          { accessLevel: CollectiviteRole.EDITION },
          { accessLevel: CollectiviteRole.LECTURE },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    editorUser = getAuthUserFromDcp(testCollectiviteAndUsersResult.users[0]);
    readerUser = getAuthUserFromDcp(testCollectiviteAndUsersResult.users[1]);
    cleanup = testCollectiviteAndUsersResult.cleanup;

    const editorSignIn = await signInWith({
      email: testCollectiviteAndUsersResult.users[0].email,
      password: TEST_USER_PASSWORD,
    });
    editorToken = editorSignIn.data.session?.access_token ?? '';
    if (!editorToken) {
      throw new Error('Échec login editor: token manquant');
    }

    const visiteurSignIn = await signInWith(YOLO_DODO);
    visiteurToken = visiteurSignIn.data.session?.access_token ?? '';
    if (!visiteurToken) {
      throw new Error('Échec login visiteur: token manquant');
    }
  });

  afterAll(async () => {
    await cleanup?.();
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

  test('editor can update document then visiteur cannot download and admin gets correct filename', async () => {
    const testAgent = request(app.getHttpServer());

    const createdDocument = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: editorToken,
      fileName: 'original.pdf',
    });
    const { hash } = createdDocument;

    // Visiteur can download the document for now
    await request(app.getHttpServer())
      .get(`/collectivites/${collectivite.id}/documents/${hash}/download`)
      .set('Authorization', `Bearer ${visiteurToken}`)
      .buffer(true)
      .expect(200);

    const caller = router.createCaller({ user: editorUser });
    const updated = await caller.collectivites.documents.update({
      collectiviteId: collectivite.id,
      hash,
      filename: 'updated-name.pdf',
      confidentiel: true,
    });

    expect(updated.filename).toBe('updated-name.pdf');
    expect(updated.confidentiel).toBe(true);

    // Visiteur cannot download the document anymore
    await request(app.getHttpServer())
      .get(`/collectivites/${collectivite.id}/documents/${hash}/download`)
      .set('Authorization', `Bearer ${visiteurToken}`)
      .expect(403);

    // Editor can download the document and the filename is updated
    const downloadResponse = await request(app.getHttpServer())
      .get(`/collectivites/${collectivite.id}/documents/${hash}/download`)
      .set('Authorization', `Bearer ${editorToken}`)
      .buffer(true)
      .expect(200);

    expect(downloadResponse.headers['content-disposition']).toMatch(
      /attachment.*filename="updated-name\.pdf"/
    );
    expect(Buffer.isBuffer(downloadResponse.body)).toBe(true);
  });
});
