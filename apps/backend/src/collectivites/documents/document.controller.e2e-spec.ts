import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getTestApp,
  getTestDatabase,
  signInWith,
  YOLO_DODO,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import * as fs from 'fs';
import * as path from 'path';
import request from 'supertest';
import { deleteAllDocuments } from './documents.test-fixture';

const TEST_USER_PASSWORD = 'yolododo';

const TEST_PDF_PATH = path.join(__dirname, './samples/document_test.pdf');

describe('Document Controller', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let collectiviteId: number;
  let adminAuthToken: string;
  let lectureUserToken: string;
  let visiteUserToken: string;
  let cleanup: () => Promise<void>;
  let testPdfBuffer: Buffer;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);

    // Load test PDF file
    testPdfBuffer = fs.readFileSync(TEST_PDF_PATH);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      db,
      {
        users: [
          {
            accessLevel: CollectiviteRole.ADMIN,
          },
          {
            accessLevel: CollectiviteRole.LECTURE,
          },
        ],
      }
    );

    const visiteUser = await signInWith(YOLO_DODO);
    visiteUserToken = visiteUser.data.session?.access_token ?? '';
    if (!visiteUserToken) {
      throw new Error('Échec login visite user : token manquant');
    }

    collectiviteId = testCollectiviteAndUsersResult.collectivite.id;
    cleanup = testCollectiviteAndUsersResult.cleanup;

    const adminUser = testCollectiviteAndUsersResult.users[0];
    const adminUserSignInResponse = await signInWith({
      email: adminUser.email,
      password: TEST_USER_PASSWORD,
    });
    adminAuthToken = adminUserSignInResponse.data.session?.access_token ?? '';
    if (!adminAuthToken) {
      throw new Error('Échec login admin user: token manquant');
    }

    const lectureUser = testCollectiviteAndUsersResult.users[1];
    const lectureUserSignInResponse = await signInWith({
      email: lectureUser.email,
      password: TEST_USER_PASSWORD,
    });
    lectureUserToken =
      lectureUserSignInResponse.data.session?.access_token ?? '';
    if (!lectureUserToken) {
      throw new Error('Échec login lecture user: token manquant');
    }
  });

  beforeEach(async () => {
    // delete all documents from the collectivite
    await deleteAllDocuments({
      databaseService: db,
      collectiviteId,
    });
  });

  afterAll(async () => {
    await cleanup?.();
    await app?.close();
  });

  describe('Upload document', () => {
    test('upload document with authenticated user having permission', async () => {
      const fileName = 'test-doc.pdf';

      const response = await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .attach('file', testPdfBuffer, fileName)
        .field('confidentiel', 'false')
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        collectiviteId,
        hash: expect.any(String),
        filename: fileName,
        confidentiel: false,
      });
      expect(response.body.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('upload document with confidentiel true', async () => {
      const fileName = 'confidentiel-doc.pdf';

      const response = await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .attach('file', testPdfBuffer, fileName)
        .field('confidentiel', 'true')
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        collectiviteId,
        hash: expect.any(String),
        filename: fileName,
        confidentiel: true,
      });
    });

    test('upload without file returns 400', async () => {
      const response = await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .field('confidentiel', 'false')
        .expect(400);

      expect(response.body).toMatchObject({
        message: 'File is required',
        statusCode: 400,
      });
    });

    test('upload without auth returns 401', async () => {
      await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .attach('file', testPdfBuffer, 'unauth.pdf')
        .expect(401);
    });

    test('upload with user without permission on collectivite returns 403', async () => {
      await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${visiteUserToken}`)
        .attach('file', testPdfBuffer, 'noperm.pdf')
        .expect(403);
    });

    test('upload with lectureuser on collectivite returns 403', async () => {
      await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${lectureUserToken}`)
        .attach('file', testPdfBuffer, 'noperm.pdf')
        .expect(403);
    });
  });

  describe('Download document', () => {
    test('download existing document returns 200 with file', async () => {
      const fileName = 'download-test.pdf';

      const uploadResponse = await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .attach('file', testPdfBuffer, fileName)
        .field('confidentiel', 'false')
        .expect(201);

      const hash = uploadResponse.body.hash as string;

      const downloadResponse = await request(app.getHttpServer())
        .get(`/collectivites/${collectiviteId}/documents/${hash}/download`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .buffer(true)
        .expect(200);

      expect(downloadResponse.headers['content-disposition']).toMatch(
        /attachment.*filename="download-test\.pdf"/
      );
      expect(Buffer.isBuffer(downloadResponse.body)).toBe(true);
      expect(downloadResponse.body).toEqual(testPdfBuffer);
    });

    test('download existing non confidential document is possible by another user in visite mode', async () => {
      const fileName = 'download-test.pdf';

      const uploadResponse = await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .attach('file', testPdfBuffer, fileName)
        .field('confidentiel', 'false')
        .expect(201);

      const hash = uploadResponse.body.hash as string;

      const downloadResponse = await request(app.getHttpServer())
        .get(`/collectivites/${collectiviteId}/documents/${hash}/download`)
        .set('Authorization', `Bearer ${visiteUserToken}`)
        .buffer(true)
        .expect(200);

      expect(downloadResponse.headers['content-disposition']).toMatch(
        /attachment.*filename="download-test\.pdf"/
      );
      expect(Buffer.isBuffer(downloadResponse.body)).toBe(true);
      expect(downloadResponse.body).toEqual(testPdfBuffer);
    });

    test('download existing confidential document is not allowed for another user in visite mode', async () => {
      const fileName = 'download-test.pdf';

      const uploadResponse = await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .attach('file', testPdfBuffer, fileName)
        .field('confidentiel', 'true')
        .expect(201);

      const hash = uploadResponse.body.hash as string;

      await request(app.getHttpServer())
        .get(`/collectivites/${collectiviteId}/documents/${hash}/download`)
        .set('Authorization', `Bearer ${visiteUserToken}`)
        .expect(403);
    });

    test('download existing confidential document is allowed for lecture user', async () => {
      const fileName = 'download-test.pdf';

      const uploadResponse = await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .attach('file', testPdfBuffer, fileName)
        .field('confidentiel', 'true')
        .expect(201);

      const hash = uploadResponse.body.hash as string;

      await request(app.getHttpServer())
        .get(`/collectivites/${collectiviteId}/documents/${hash}/download`)
        .set('Authorization', `Bearer ${lectureUserToken}`)
        .expect(200);
    });

    test('download non-existent document returns 404', async () => {
      const fakeHash =
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

      const response = await request(app.getHttpServer())
        .get(`/collectivites/${collectiviteId}/documents/${fakeHash}/download`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('Document non trouvé'),
      });
    });

    test('download is not allowed without authentication', async () => {
      const fileName = 'anon-download.pdf';

      const uploadResponse = await request(app.getHttpServer())
        .post(`/collectivites/${collectiviteId}/documents/upload`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .attach('file', testPdfBuffer, fileName)
        .field('confidentiel', 'false')
        .expect(201);

      const hash = uploadResponse.body.hash as string;

      await request(app.getHttpServer())
        .get(`/collectivites/${collectiviteId}/documents/${hash}/download`)
        .buffer(true)
        .expect(401);
    });
  });
});
