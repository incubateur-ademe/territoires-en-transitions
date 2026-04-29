import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  deleteAllDocuments,
  uploadCreateTestDocument,
} from '@tet/backend/collectivites/documents/documents.test-fixture';
import { getAuthUserFromUserCredentials, signInWith } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
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

describe('ListDocumentsRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let adminToken: string;
  let editorCaller: ReturnType<TrpcRouter['createCaller']>;
  let lectureCaller: ReturnType<TrpcRouter['createCaller']>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const { collectivite: col, users } = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          { role: CollectiviteRole.EDITION },
          { role: CollectiviteRole.LECTURE },
        ],
      }
    );

    collectivite = col;
    editorCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(users[0]),
    });
    lectureCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(users[1]),
    });

    const adminSignIn = await signInWith({
      email: users[0].email,
      password: users[0].password,
    });
    adminToken = adminSignIn.data.session?.access_token ?? '';
    if (!adminToken) {
      throw new Error('Échec login editor: token manquant');
    }
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

  test('collectivité vide : retourne un tableau vide', async () => {
    const result = await editorCaller.collectivites.documents.list({
      collectiviteId: collectivite.id,
    });

    expect(result).toEqual({
      data: [],
      count: 0,
      page: 1,
      pageSize: 100,
      pageCount: 0,
    });
  });

  test('retourne le document avec tous les champs attendus', async () => {
    const testAgent = request(app.getHttpServer());

    const doc = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: adminToken,
      fileName: 'rapport.pdf',
    });

    const result = await editorCaller.collectivites.documents.list({
      collectiviteId: collectivite.id,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: expect.any(Number),
      collectiviteId: collectivite.id,
      hash: doc.hash,
      filename: 'rapport.pdf',
      confidentiel: false,
      bucketId: expect.any(String),
      fileId: expect.any(String),
      filesize: expect.any(Number),
    });
    expect(result.count).toBe(1);
  });

  test('filtre par nom de fichier (sans tenir compte des accents)', async () => {
    const testAgent = request(app.getHttpServer());

    const docAccent = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: adminToken,
      fileName: 'café-etude.pdf',
    });
    // update du nom pour les besoins du test, car l'encodage des caractères
    // lors de l'upload via supertest n'est pas garanti
    await editorCaller.collectivites.documents.update({
      collectiviteId: collectivite.id,
      hash: docAccent.hash,
      filename: 'café-etude.pdf',
    });

    await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: adminToken,
      fileName: 'autre.doc',
    });

    const avecCafe = await editorCaller.collectivites.documents.list({
      collectiviteId: collectivite.id,
      filenameContains: 'cafe',
    });

    expect(avecCafe.data).toHaveLength(1);
    expect(avecCafe.data[0].filename).toBe('café-etude.pdf');
    expect(avecCafe.count).toBe(1);

    const avecEtude = await editorCaller.collectivites.documents.list({
      collectiviteId: collectivite.id,
      filenameContains: 'étude',
    });

    expect(avecEtude.data).toHaveLength(1);
    expect(avecEtude.data[0].filename).toBe('café-etude.pdf');

    const aucunMatch = await editorCaller.collectivites.documents.list({
      collectiviteId: collectivite.id,
      filenameContains: 'absent',
    });

    expect(aucunMatch.data).toHaveLength(0);
    expect(aucunMatch.count).toBe(0);
  });

  test('utilisateur avec le droit read_confidentiel voit le document confidentiel', async () => {
    const testAgent = request(app.getHttpServer());

    const doc = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: adminToken,
      fileName: 'secret.pdf',
    });

    await editorCaller.collectivites.documents.update({
      collectiviteId: collectivite.id,
      hash: doc.hash,
      confidentiel: true,
    });

    const result = await lectureCaller.collectivites.documents.list({
      collectiviteId: collectivite.id,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].confidentiel).toBe(true);
  });

  test('filtre par liste de hashes', async () => {
    const testAgent = request(app.getHttpServer());

    const doc1 = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: adminToken,
      fileName: 'hash-a.pdf',
    });
    const doc2 = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: adminToken,
      fileName: 'hash-b.pdf',
    });
    await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: adminToken,
      fileName: 'hash-c.pdf',
    });

    const result = await editorCaller.collectivites.documents.list({
      collectiviteId: collectivite.id,
      hashes: [doc1.hash, doc2.hash],
    });

    expect(result.data).toHaveLength(2);
    expect(result.count).toBe(2);
    const returnedHashes = result.data.map((d) => d.hash);
    expect(returnedHashes).toContain(doc1.hash);
    expect(returnedHashes).toContain(doc2.hash);

    const aucunMatch = await editorCaller.collectivites.documents.list({
      collectiviteId: collectivite.id,
      hashes: ['hash-inexistant'],
    });

    expect(aucunMatch.data).toHaveLength(0);
    expect(aucunMatch.count).toBe(0);
  });

  test('utilisateur vérifié sans rôle dans la collectivité ne voit pas les documents confidentiels mais voit les documents publiques', async () => {
    const testAgent = request(app.getHttpServer());

    const noAccessUserResult = await addTestUser(databaseService);
    const noAccessAuthUser = getAuthUserFromUserCredentials(
      noAccessUserResult.user
    );

    const docPublic = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: adminToken,
      fileName: 'public.pdf',
    });

    const docConfidentiel = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: adminToken,
      fileName: 'confidentiel.pdf',
    });

    await editorCaller.collectivites.documents.update({
      collectiviteId: collectivite.id,
      hash: docConfidentiel.hash,
      confidentiel: true,
    });

    const noAccessCaller = router.createCaller({ user: noAccessAuthUser });
    const result = await noAccessCaller.collectivites.documents.list({
      collectiviteId: collectivite.id,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].hash).toBe(docPublic.hash);
    expect(result.data[0].confidentiel).toBe(false);
  });
});
