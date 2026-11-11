import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthToken, getTestApp, getTestDatabase } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { success } from '@tet/backend/utils/result.type';
import { randomBytes } from 'crypto';
import { Readable } from 'node:stream';
import request from 'supertest';
import { Snbc3ReleaseStorageService } from '../import-snbc3/snbc3-release-storage.service';
import { mockTrajectoireSnbc3Flag } from './trajectoire-snbc3.test-fixture';

const METHODOLOGIE_NAME = 'ADEME-Methodo-Outil-trajectoire-référence-V2.pdf';

describe('GET /trajectoires/snbc3/methodologie', () => {
  let app: INestApplication;
  let authToken: string;
  let collectiviteId: number;
  const pdf = randomBytes(256);

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);
    const { user } = await addTestUser(db);
    authToken = await getAuthToken({
      email: user.email ?? '',
      password: user.password,
    });
    const { collectivite } = await addTestCollectivite(db, { type: 'epci' });
    collectiviteId = collectivite.id;

    // Le stockage est simulé : le bucket `trajectoires-snbc3` est celui de
    // l'app, une spec qui y écrirait remplacerait le PDF de l'import local.
    // La lecture du bucket est testée par snbc3-release-storage.service.spec.
    const spy = vi
      .spyOn(app.get(Snbc3ReleaseStorageService), 'getMethodologie')
      .mockImplementation(async () =>
        success({ stream: Readable.from([pdf]), fileName: METHODOLOGIE_NAME })
      );

    return async () => {
      spy.mockRestore();
      await app.close();
    };
  }, 30000);

  test('sert le PDF stocké par le dernier import, sous son nom d’origine', async () => {
    const response = await request(app.getHttpServer())
      .get(`/trajectoires/snbc3/methodologie?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .responseType('blob')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/^application\/pdf/);
    // « é » tient en Latin-1 : Express garde le nom tel quel, sans `filename*`.
    expect(response.headers['content-disposition']).toContain(
      `filename="${METHODOLOGIE_NAME}"`
    );
    expect(Buffer.compare(response.body as Buffer, pdf)).toBe(0);
  });

  test('répond 404 tant qu’aucun import n’a stocké la méthodologie', async () => {
    vi.mocked(
      app.get(Snbc3ReleaseStorageService).getMethodologie
    ).mockResolvedValueOnce(success(null));

    await request(app.getHttpServer())
      .get(`/trajectoires/snbc3/methodologie?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  test('refuse sans le flag SNBC 3', async () => {
    const restoreFlag = mockTrajectoireSnbc3Flag(app, false);
    onTestFinished(restoreFlag);

    await request(app.getHttpServer())
      .get(`/trajectoires/snbc3/methodologie?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(403);
  });

  test('refuse sans utilisateur authentifié', async () => {
    await request(app.getHttpServer())
      .get(`/trajectoires/snbc3/methodologie?collectiviteId=${collectiviteId}`)
      .expect(401);
  });
});
