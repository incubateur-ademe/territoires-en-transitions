import { INestApplication } from '@nestjs/common';
import { createServiceTag } from '@tet/backend/collectivites/collectivites.test-fixture';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { Workbook } from 'exceljs';
import { default as request } from 'supertest';
import { TrpcRouter } from '../../../utils/trpc/trpc.router';
import { createIndicateurPerso } from '../../definitions/definitions.test-fixture';
import { indicateurDefinitionTable } from '../../definitions/indicateur-definition.table';

describe('Indicateurs', () => {
  let app: INestApplication;
  let authToken: string;
  let databaseService: DatabaseService;
  let router: TrpcRouter;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    router = app.get(TrpcRouter);

    const testUserResult = await addTestUser(databaseService, {
      collectiviteId: 1,
      role: CollectiviteRole.LECTURE,
    });
    authToken = await getAuthToken({
      email: testUserResult.user.email ?? '',
      password: testUserResult.user.password,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('Exporte un indicateur au format XLSX (mode selection)', async () => {
    const rows = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_8'));

    const indicateurId = rows[0].id;

    const response = await request(app.getHttpServer())
      .post('/indicateur-definitions/xlsx')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ mode: 'selection', collectiviteId: 1, indicateurIds: [indicateurId] })
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

  test("Exporte tous les indicateurs filtrés (mode all, au-delà d'une page)", async () => {
    // Collectivité + utilisateur frais (admin → droit de lecture des confidentiels)
    const { collectivite, user } = await addTestCollectiviteAndUser(
      databaseService,
      { user: { role: CollectiviteRole.ADMIN } }
    );

    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    // Un service tag commun sert de filtre partagé
    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service export filtre' },
    });

    // On crée strictement plus d'indicateurs qu'une page de liste (9 par défaut côté UI)
    const nbIndicateurs = 12;
    const indicateurIds: number[] = [];
    for (let i = 0; i < nbIndicateurs; i++) {
      indicateurIds.push(
        await createIndicateurPerso({
          caller,
          indicateurData: {
            collectiviteId: collectivite.id,
            titre: `Indicateur export ${i}`,
            services: [{ id: serviceTag.id }],
          },
        })
      );
    }

    const collectiviteAuthToken = await getAuthToken({
      email: user.email ?? '',
      password: user.password,
    });

    const response = await request(app.getHttpServer())
      .post('/indicateur-definitions/xlsx')
      .set('Authorization', `Bearer ${collectiviteAuthToken}`)
      .send({
        mode: 'all',
        collectiviteId: collectivite.id,
        filters: { serviceIds: [serviceTag.id] },
      })
      .expect(201)
      .responseType('blob');

    const body = response.body as ArrayBuffer;

    const wb = new Workbook();
    await wb.xlsx.load(body);

    // Les indicateurs perso n'ont ni parent ni enfant : un onglet par indicateur.
    // On vérifie que l'export contient bien tous les indicateurs filtrés,
    // pas seulement la première page.
    expect(wb.worksheets.length).toBe(nbIndicateurs);

    // Cas de contrôle : le mode `selection` n'exporte que les ids fournis.
    const selectionIds = indicateurIds.slice(0, 2);
    const selectionResponse = await request(app.getHttpServer())
      .post('/indicateur-definitions/xlsx')
      .set('Authorization', `Bearer ${collectiviteAuthToken}`)
      .send({
        mode: 'selection',
        collectiviteId: collectivite.id,
        indicateurIds: selectionIds,
      })
      .expect(201)
      .responseType('blob');

    const selectionWb = new Workbook();
    await selectionWb.xlsx.load(selectionResponse.body as ArrayBuffer);
    expect(selectionWb.worksheets.length).toBe(selectionIds.length);
  });

  test('Refuse une requête sans mode (ancien contrat)', async () => {
    await request(app.getHttpServer())
      .post('/indicateur-definitions/xlsx')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ collectiviteId: 1, indicateurIds: [1] })
      .expect(400);
  });
});
