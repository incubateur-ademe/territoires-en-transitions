import { INestApplication } from '@nestjs/common';
import {
  getAuthToken,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { Workbook } from 'exceljs';
import { default as request } from 'supertest';
import { indicateurDefinitionTable } from '../../definitions/indicateur-definition.table';

describe('Indicateurs', () => {
  let app: INestApplication;
  let authToken: string;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);

    const testUserResult = await addTestUser(databaseService, {
      collectiviteId: 1,
      role: CollectiviteRole.LECTURE,
    });
    authToken = await getAuthToken({
      email: testUserResult.user.email!,
      password: testUserResult.user.password,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('Exporte un indicateur au format XLSX', async () => {
    const rows = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_8'));

    const indicateurId = rows[0].id;

    const response = await request(app.getHttpServer())
      .post('/indicateur-definitions/xlsx')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ collectiviteId: 1, indicateurIds: [indicateurId] })
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
      /^Ambérieu-en-Bugey - cae_8 - Rénovation énergétique des logements - \d{4}-\d{2}-\d{2}.*\.xlsx$/
    );
    // poids approximitatif du fichier attendu car la date de génération peut le faire un peu varier
    expect(body.byteLength).toBeGreaterThanOrEqual(6700);
    expect(body.byteLength).toBeLessThanOrEqual(6800);

    // crée le classeur et vérifie le contenu de la 2ème ligne de la 1ère feuille
    const wb = new Workbook();
    await wb.xlsx.load(body);
    const ws = wb.getWorksheet(1);
    expect(ws).toBeDefined();
    const row = ws?.getRow(2);
    expect(row?.values).toEqual([
      undefined, // index des colonnes à partir de 1
      'cae_8',
      'Rénovation énergétique des logements',
      'Mes objectifs',
      'nombre logements rénovés/100 logements existants',
      21,
      13,
    ]);
  });
});
