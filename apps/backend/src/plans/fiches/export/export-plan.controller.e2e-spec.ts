import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionSecteurAttributionTable } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-action-secteur-attribution.table';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { OrigineSecteursEnum } from '@tet/domain/plans';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { CollectiviteRole } from '@tet/domain/users';
import { Workbook } from 'exceljs';
import mammoth from 'mammoth';
import { default as request } from 'supertest';

describe('Export plan', () => {
  let app: INestApplication;
  let authToken: string;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);

    const testUserResult = await addTestUser(db, {
      collectiviteId: 1,
      role: CollectiviteRole.ADMIN,
    });
    authToken = await getAuthToken({
      email: testUserResult.user.email ?? '',
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
      'Giga service\nUltra service',
      'Giga structure\nUltra structure',
      'Giga partenaire\nUltra partenaire',
      expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
      expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
      expect.any(String), // pilote name (peut varier selon les données)
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
  describe('plan avec sous-action et secteurs réglementaires', () => {
    let memberToken: string;
    let collectiviteId: number;
    let planId: number;

    beforeAll(async () => {
      const { collectivite, user } = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
      });
      collectiviteId = collectivite.id;
      memberToken = await getAuthToken({
        email: user.email ?? '',
        password: user.password,
      });

      const authUser = getAuthUserFromUserCredentials(user);
      const router = await getTestRouter(app);
      const caller = router.createCaller({ user: authUser });
      const plan = await caller.plans.plans.create({
        nom: 'Plan climat',
        collectiviteId,
      });
      planId = plan.id;
      const axe = await caller.plans.axes.create({
        nom: 'Axe 1 : Mobilités',
        collectiviteId,
        planId,
        parent: planId,
      });

      const { ficheId } = await createFicheAndCleanupFunction({
        caller,
        ficheInput: {
          collectiviteId,
          titre: 'Développer le covoiturage',
          axeId: axe.id,
        },
      });
      const { ficheId: sousActionId } = await createFicheAndCleanupFunction({
        caller,
        ficheInput: {
          collectiviteId,
          titre: 'Créer une aire de covoiturage',
          parentId: ficheId,
        },
      });

      await db.db.insert(ficheActionSecteurAttributionTable).values([
        {
          ficheId,
          secteurs: ['transport_routier', 'amenagement'],
          origine: OrigineSecteursEnum.MANUELLE,
        },
        {
          ficheId: sousActionId,
          secteurs: [],
          origine: OrigineSecteursEnum.AUTOMATIQUE,
        },
      ]);
    });

    const exportPlan = (format: 'xlsx' | 'docx') =>
      request(app.getHttpServer())
        .post('/plan/export')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ collectiviteId, planId, format })
        .expect(201)
        .responseType('blob');

    test('le classeur porte les sous-actions et les secteurs réglementaires', async () => {
      const response = await exportPlan('xlsx');

      const wb = new Workbook();
      await wb.xlsx.load(response.body as ArrayBuffer);
      const ws = wb.getWorksheet(1);
      const cellsOf = (rowNumber: number) =>
        (ws?.getRow(rowNumber).values as unknown[]).slice(1, 5);

      expect(cellsOf(2)).toEqual([
        'Axe (x)',
        "Titre de l'action",
        'Titre de la sous-action',
        'Secteurs réglementaires',
      ]);
      expect(cellsOf(3)).toEqual([
        'Axe 1 : Mobilités',
        'Développer le covoiturage',
        '',
        'Transport routier\nAménagement',
      ]);
      // la sous-action répète l'axe et le titre de sa fiche parente
      expect(cellsOf(4)).toEqual([
        'Axe 1 : Mobilités',
        'Développer le covoiturage',
        'Créer une aire de covoiturage',
        'Non attribuable',
      ]);
    });

    test('le document Word est produit avec les sous-actions', async () => {
      const response = await exportPlan('docx');

      const { value: text } = await mammoth.extractRawText({
        buffer: response.body as Buffer,
      });
      expect(text).toContain('Développer le covoiturage');
      expect(text).toContain('Créer une aire de covoiturage');
    });
  });
});
