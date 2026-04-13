import { INestApplication } from '@nestjs/common';
import {
  getAuthToken,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { CollectiviteRole } from '@tet/domain/users';
import { Workbook } from 'exceljs';
import { default as request } from 'supertest';

describe('Export plan', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);

    const testUserResult = await addTestUser(db, {
      collectiviteId: 1,
      role: CollectiviteRole.ADMIN,
    });
    authToken = await getAuthToken({
      email: testUserResult.user.email!,
      password: testUserResult.user.password,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('Exporte un plan au format XLSX', async () => {
    const response = await request(app.getHttpServer())
      .post('/plan/export')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ collectiviteId: 1, planId: 12, format: 'xlsx' })
      .expect(201)
      .responseType('blob');

    const fileName = decodeURI(
      response.headers['content-disposition']
        .split('filename=')[1]
        .split(';')[0]
        .split('"')[1]
    );

    const body = response.body as ArrayBuffer;

    expect(fileName).toMatch(
      /^Export_Amberieu-en-Bugey_Plan Velo 2024-2028_\d{4}-\d{2}-\d{2}.*\.xlsx$/
    );
    expect(body.byteLength).toBeGreaterThanOrEqual(7800);
    expect(body.byteLength).toBeLessThanOrEqual(8200);

    const wb = new Workbook();
    await wb.xlsx.load(body);
    const ws = wb.getWorksheet(1);
    expect(ws).toBeDefined();
    const row = ws?.getRow(7);
    expect(row?.values).toMatchObject([
      undefined,
      'Axe 4 : Développer une culture vélo',
      '4.2 : Déployer des plans de mobilité scolaires',
      '4.2.1 : Apprendre le vélo aux enfants',
      '4.2.1.1 : Faire passer permis vélo aux CM2',
      'Permis vélo CM2 école TET 2024-2028',
      'Activités économiques',
      'Agriculture et alimentation',
      'Non',
      'À venir',
      'Ultra service\nGiga service',
      'Ultra structure\nGiga structure',
      'Ultra partenaire\nGiga partenaire',
      expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
      expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
      'Yolo Dodo',
    ]);
  });

  test('Exporte un plan au format DOCX', async () => {
    const response = await request(app.getHttpServer())
      .post('/plan/export')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ collectiviteId: 1, planId: 12, format: 'docx' })
      .expect(201)
      .responseType('blob');

    const fileName = decodeURI(
      response.headers['content-disposition']
        .split('filename=')[1]
        .split(';')[0]
        .split('"')[1]
    );

    const body = response.body as Buffer;

    expect(fileName).toMatch(
      /^Export_Amberieu-en-Bugey_Plan Velo 2024-2028_\d{4}-\d{2}-\d{2}.*\.docx$/
    );
    expect(body.byteLength).toBeGreaterThanOrEqual(10200);
    expect(body.byteLength).toBeLessThanOrEqual(10700);
  });
});
