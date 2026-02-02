import { INestApplication } from '@nestjs/common';
import { insertFixturePourScoreIndicatif } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CellValue, Workbook } from 'exceljs';
import { DateTime } from 'luxon';
import { default as request } from 'supertest';
import { getTestApp } from '../../../test/app-utils';

describe('Referentiels scoring routes', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = app.get(DatabaseService);
  });

  test(`Export du snapshot pour un utilisateur non authentifié`, async () => {
    await request(app.getHttpServer())
      .get(
        `/collectivites/1/referentiels/eci/score-snapshots/export-comparison`
      )
      .query({
        exportFormat: 'excel',
        isAudit: 'false',
        snapshotReferences: ['score-courant'],
      })
      .expect(401);
  });

  test(`Export du snapshot pour un utilisateur anonyme`, async () => {
    const responseSnapshotExport = await request(app.getHttpServer())
      .get(
        `/collectivites/1/referentiels/eci/score-snapshots/export-comparison`
      )
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .query({
        exportFormat: 'excel',
        isAudit: 'false',
        snapshotReferences: ['score-courant'],
      })
      .expect(200)
      .responseType('blob');

    const currentDate = DateTime.now().toISODate();
    const exportFileName = responseSnapshotExport.headers['content-disposition']
      .split('filename=')[1]
      .split(';')[0];

    expect(exportFileName).toBe(
      `"Export_ECI_Amberieu-en-Bugey_${currentDate}.xlsx"`
    );
    const body = responseSnapshotExport.body as ArrayBuffer;
    const wb = new Workbook();
    await wb.xlsx.load(body);
    const ws = wb.getWorksheet(1);
    expect(ws).toBeDefined();
    // vérifie la ligne d'en-têtes
    const header2 = ws?.getRow(7);
    expect(header2?.values).toEqual(
      expect.arrayContaining([
        'N°',
        'Intitulé',
        'Description',
        'Phase',
        'Potentiel max',
        'Potentiel collectivité',
        'Points réalisés',
        '% réalisé',
        'Points programmés',
        '% programmé',
        'Points pas faits',
        '% pas fait',
        'Statut',
        "Champs de précision de l'état d'avancement",
        'Personnes pilotes',
        'Services ou Directions pilotes',
        'Documents liés',
        'Actions liées',
      ])
    );

    // vérifie le total du référentiel
    const row8 = ws?.getRow(8);
    expect(row8?.values).toEqual([
      undefined,
      'Total',
      '',
      undefined,
      '',
      500,
      500,
      {
        formula: 'G9+G71+G151+G261+G307',
      },
      {
        formula: 'IFERROR(G8/F8,"")',
      },
      {
        formula: 'I9+I71+I151+I261+I307',
      },
      {
        formula: 'IFERROR(I8/F8,"")',
      },
      {
        formula: 'K9+K71+K151+K261+K307',
      },
      {
        formula: 'IFERROR(K8/F8,"")',
      },
      '',
      '',
      '',
      '',
      undefined,
      '',
    ]);

    // vérifie un axe
    const row9 = ws?.getRow(9);
    expect(row9?.values).toEqual([
      undefined,
      '1',
      "Définition d'une stratégie globale de la politique économie circulaire et inscription dans le territoire",
      undefined,
      '',
      90,
      90,
      {
        formula: 'G10+G47+G61',
      },
      {
        formula: 'IFERROR(G9/F9,"")',
      },
      {
        formula: 'I10+I47+I61',
      },
      {
        formula: 'IFERROR(I9/F9,"")',
      },
      {
        formula: 'K10+K47+K61',
      },

      {
        formula: 'IFERROR(K9/F9,"")',
      },
      '',
      '',
    ]);

    // vérifie une mesure
    const row10 = ws?.getRow(10);
    expect(row10?.values).toEqual([
      undefined,
      '1.1',
      'Définir une stratégie globale de la politique Economie Circulaire et assurer un portage politique fort',
      expect.any(String),
      '',
      30,
      30,
      {
        formula: 'G11+G17+G23+G27+G42',
      },
      {
        formula: 'IFERROR(G10/F10,"")',
      },
      {
        formula: 'I11+I17+I23+I27+I42',
      },
      {
        formula: 'IFERROR(I10/F10,"")',
      },
      {
        formula: 'K11+K17+K23+K27+K42',
      },
      {
        formula: 'IFERROR(K10/F10,"")',
      },
      '',
      '',
    ]);

    // vérifie une sous-mesure
    const row11 = ws?.getRow(11);
    expect(row11?.values).toEqual([
      undefined,
      '1.1.1',
      "S'engager politiquement et mettre en place des moyens",
      expect.any(String),
      'Bases',
      6,
      6,
      { formula: 'F11*H11' },
      undefined,
      { formula: 'F11*J11' },
      undefined,
      { formula: 'F11*L11' },
      undefined,
      'Non renseigné',
      '',
    ]);

    // vérifie la taille
    const expectedExportSize = 55.1;
    const exportFileSize = parseInt(
      responseSnapshotExport.headers['content-length']
    );
    expect(exportFileSize / 1000).toBeCloseTo(expectedExportSize, 0);
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  test(`Export du snapshot avec un score indicatif`, async () => {
    const collectiviteId = 2; // sur la 1 CAE est verrouillé par une demande de labellisation
    const fixture = {
      collectiviteId,
      actionId: 'cae_1.2.3.3.1',
      identifiantReferentiel: 'cae_6.a',
      dateValeur: '2020-01-01',
      exprScore: `si val(cae_6.a) > limite(cae_6.a) alors 0
sinon si val(cae_6.a) < cible(cae_6.a) alors 1
sinon ((limite(cae_6.a) - val(cae_6.a)) / (limite(cae_6.a) - cible(cae_6.a)))`,
      objectif: 300,
      resultat: 500,
    };

    // insère les données de test
    const cleanup = await insertFixturePourScoreIndicatif(
      databaseService,
      fixture
    );
    onTestFinished(async () => {
      await cleanup();
    });

    const responseSnapshotExport = await request(app.getHttpServer())
      .get(
        `/collectivites/${collectiviteId}/referentiels/cae/score-snapshots/export-comparison`
      )
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .query({
        exportFormat: 'excel',
        isAudit: 'false',
        snapshotReferences: ['score-courant'],
        isScoreIndicatifEnabled: 'true',
      })
      .expect(200)
      .responseType('blob');

    const currentDate = DateTime.now().toISODate();
    const exportFileName = responseSnapshotExport.headers['content-disposition']
      .split('filename=')[1]
      .split(';')[0];

    expect(exportFileName).toBe(`"Export_CAE_Arbent_${currentDate}.xlsx"`);
    const expectedExportSize = 221.12;
    const exportFileSize = parseInt(
      responseSnapshotExport.headers['content-length']
    );
    expect(exportFileSize / 1000).toBeCloseTo(expectedExportSize, 0);

    const body = responseSnapshotExport.body as ArrayBuffer;
    const wb = new Workbook();
    await wb.xlsx.load(body);
    const ws = wb.getWorksheet(1);
    expect(ws).toBeDefined();
    const firstRows = ws?.getRows(0, 200);
    const row = firstRows?.find(
      (r) => (r.values as CellValue[])?.[1] === '1.2.3.3.1'
    );
    expect(row).toBeDefined();
    const cell = row?.getCell('O');
    expect(cell?.value)
      .toEqual(`Pourcentage indicatif Fait de 80% calculé sur la base de : 500 kg/hab en 2020 (source : CITEPA)
Pourcentage indicatif Fait en 2020 de 100% calculé si 300 kg/hab en 2020 (source : Objectifs de la collectivité) atteint`);

    // vérifie le tri des lignes par actionId
    // (1.2.3.2.1 doit être suivie de 1.2.3.2.2 et non pas 1.2.3.2.10)
    const rowIndex1 = firstRows?.findIndex(
      (r) => (r.values as CellValue[])?.[1] === '1.2.3.2.1'
    );
    expect(rowIndex1).toBeGreaterThan(0);
    const nextRow = firstRows?.[(rowIndex1 || 0) + 1];
    expect((nextRow?.values as CellValue[])?.[1]).toEqual('1.2.3.2.2');

    // vérifie le total du référentiel
    const row8 = ws?.getRow(8);
    expect(row8?.values).toEqual([
      undefined,
      'Total',
      '',
      undefined,
      '',
      500,
      496,
      {
        formula: 'G9+G300+G519+G724+G980+G1117',
      },
      {
        formula: 'IFERROR(G8/F8,"")',
      },
      {
        formula: 'I9+I300+I519+I724+I980+I1117',
      },
      {
        formula: 'IFERROR(I8/F8,"")',
      },
      {
        formula: 'K9+K300+K519+K724+K980+K1117',
      },
      {
        formula: 'IFERROR(K8/F8,"")',
      },
      '',
      '',
      undefined,
      '',
      '',
      undefined,
      '',
    ]);

    // vérifie un axe
    const row9 = ws?.getRow(9);
    expect(row9?.values).toEqual([
      undefined,
      '1',
      'Planification territoriale',
      undefined,
      '',
      100,
      100,
      {
        formula: 'G10+G90+G213',
      },
      {
        formula: 'IFERROR(G9/F9,"")',
      },
      {
        formula: 'I10+I90+I213',
      },
      {
        formula: 'IFERROR(I9/F9,"")',
      },
      {
        formula: 'K10+K90+K213',
      },
      {
        formula: 'IFERROR(K9/F9,"")',
      },
      '',
      '',
    ]);

    // vérifie un sous-axe
    const row10 = ws?.getRow(10);
    expect(row10?.values).toEqual([
      undefined,
      '1.1',
      'Stratégie globale climat-air-énergie',
      undefined,
      '',
      30,
      30,
      {
        formula: 'G11+G40+G72',
      },
      {
        formula: 'IFERROR(G10/F10,"")',
      },
      {
        formula: 'I11+I40+I72',
      },
      {
        formula: 'IFERROR(I10/F10,"")',
      },
      {
        formula: 'K11+K40+K72',
      },
      {
        formula: 'IFERROR(K10/F10,"")',
      },
      '',
      '',
    ]);

    // vérifie une mesure
    const row11 = ws?.getRow(11);
    expect(row11?.values).toEqual([
      undefined,
      '1.1.1',
      'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie',
      expect.any(String),
      '',
      12,
      12,
      {
        formula: 'G12+G15+G19+G26+G30+G31+G36',
      },
      {
        formula: 'IFERROR(G11/F11,"")',
      },
      {
        formula: 'I12+I15+I19+I26+I30+I31+I36',
      },
      {
        formula: 'IFERROR(I11/F11,"")',
      },
      {
        formula: 'K12+K15+K19+K26+K30+K31+K36',
      },
      {
        formula: 'IFERROR(K11/F11,"")',
      },
      '',
      '',
    ]);

    // vérifie une sous-mesure
    const row12 = ws?.getRow(12);
    expect(row12?.values).toEqual([
      undefined,
      '1.1.1.1',
      'Formaliser la vision et les engagements',
      undefined,
      'Bases',
      0.6,
      0.6,
      {
        formula: 'F12*H12',
      },
      undefined,
      {
        formula: 'F12*J12',
      },
      undefined,
      {
        formula: 'F12*L12',
      },
      undefined,
      'Non renseigné',
      '',
    ]);
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
