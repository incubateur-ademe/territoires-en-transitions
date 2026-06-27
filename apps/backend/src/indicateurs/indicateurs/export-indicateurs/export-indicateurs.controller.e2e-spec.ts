import { INestApplication } from '@nestjs/common';
import {
  createPersonneTag,
  createServiceTag,
} from '@tet/backend/collectivites/collectivites.test-fixture';
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
import { indicateurGroupeTable } from '../../shared/models/indicateur-groupe.table';

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

    // Format consolidé : 1 onglet unique pour tous les indicateurs
    const wb = new Workbook();
    await wb.xlsx.load(body);
    expect(wb.worksheets.length).toBe(1);
    const ws = wb.getWorksheet(1)!;
    expect(ws).toBeDefined();

    // En-tête (row 1) — colonnes fixes du format consolidé
    const headerValues = ws.getRow(1).values as unknown[];
    expect(headerValues[1]).toBe('Identifiant');
    expect(headerValues[2]).toBe("Nom de l'indicateur");
    expect(headerValues[3]).toBe('Indicateur parent');
    expect(headerValues[4]).toBe('Unité');

    // Ligne de données (row 2) — identifiant, titre, pas de parent, unité
    const dataRow = ws.getRow(2).values as unknown[];
    expect(dataRow[1]).toBe('cae_8');
    expect(dataRow[2]).toBe('Rénovation énergétique des logements');
    expect(dataRow[3]).toBe(''); // cae_8 n'a pas de parent
    expect(dataRow[4]).toBe('nombre logements rénovés/100 logements existants');
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

    // Format consolidé : 1 onglet unique, 1 ligne par indicateur.
    // On vérifie que l'export contient bien tous les indicateurs filtrés,
    // pas seulement la première page.
    expect(wb.worksheets.length).toBe(1);
    // header + nbIndicateurs lignes de données
    expect(wb.getWorksheet(1)!.rowCount).toBe(nbIndicateurs + 1);

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
    expect(selectionWb.worksheets.length).toBe(1);
    expect(selectionWb.getWorksheet(1)!.rowCount).toBe(selectionIds.length + 1);
  });

  test('Format consolidé : 1 onglet, 1 ligne par indicateur avec lien parent/enfant', async () => {
    const { collectivite, user } = await addTestCollectiviteAndUser(
      databaseService,
      { user: { role: CollectiviteRole.ADMIN } }
    );

    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const serviceTag = await createServiceTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Service format consolidé' },
    });

    const personneTag = await createPersonneTag({
      database: databaseService,
      tagData: { collectiviteId: collectivite.id, nom: 'Pilote Dupont' },
    });

    const parentId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Indicateur parent',
        unite: 'kg CO2',
        commentaire: 'Commentaire parent',
        services: [{ id: serviceTag.id }],
        pilotes: [{ tagId: personneTag.id }],
        valeurs: [
          { dateValeur: '2022-01-01', resultat: 100, objectif: 120 },
          { dateValeur: '2023-01-01', resultat: 80, objectif: 90 },
        ],
      },
    });

    const childId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Indicateur enfant',
        unite: 'kg CO2',
        valeurs: [
          { dateValeur: '2022-01-01', resultat: 40 },
          { dateValeur: '2023-01-01', resultat: 35 },
        ],
      },
    });

    await databaseService.db
      .insert(indicateurGroupeTable)
      .values({ parent: parentId, enfant: childId });

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

    const wb = new Workbook();
    await wb.xlsx.load(response.body as ArrayBuffer);

    // Format consolidé : 1 seul onglet (remplace le multi-onglets)
    expect(wb.worksheets.length).toBe(1);

    const ws = wb.getWorksheet(1)!;
    expect(ws).toBeDefined();

    // L'en-tête (row 1) doit contenir les nouvelles colonnes fixes
    const headerValues = ws.getRow(1).values as unknown[];
    expect(headerValues).toContain('Indicateur parent');
    expect(headerValues).toContain('Pilotes');
    expect(headerValues).toContain('Services');
    expect(headerValues).toContain('Commentaire');
    expect(headerValues).toContain('Résultat 2022');
    expect(headerValues).toContain('Objectif 2022');

    // 1 ligne d'en-tête + 1 ligne parent + 1 ligne enfant = 3 lignes
    expect(ws.rowCount).toBe(3);

    // Ligne parent (row 2) : nom, pilotes, services, commentaire, pas d'indicateur parent
    const parentRow = ws.getRow(2).values as unknown[];
    expect(parentRow[2]).toBe('Indicateur parent');
    expect(parentRow[3]).toBe(''); // Indicateur parent vide pour un parent
    expect(parentRow[5]).toBe('Pilote Dupont'); // Pilotes
    expect(parentRow[6]).toBe('Service format consolidé'); // Services
    expect(parentRow[7]).toBe('Commentaire parent'); // Commentaire

    // Ligne enfant (row 3) : indentée, indicateur parent rempli
    const childRow = ws.getRow(3).values as unknown[];
    expect(String(childRow[2])).toContain('Indicateur enfant');
    expect(childRow[3]).toBe('Indicateur parent'); // Indicateur parent = titre du parent
  });

  test('Refuse une requête sans mode (ancien contrat)', async () => {
    await request(app.getHttpServer())
      .post('/indicateur-definitions/xlsx')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ collectiviteId: 1, indicateurIds: [1] })
      .expect(400);
  });
});
