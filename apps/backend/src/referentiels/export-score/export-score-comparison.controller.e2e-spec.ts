import { insertFixturePourScoreIndicatif } from '@/backend/test';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { INestApplication } from '@nestjs/common';
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
    const expectedExportSize = 52.475;
    const exportFileSize = parseInt(
      responseSnapshotExport.headers['content-length']
    );

    const body = responseSnapshotExport.body as Buffer;
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
        'Fiches actions liées',
      ])
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
    const expectedExportSize = 207.9;
    const exportFileSize = parseInt(
      responseSnapshotExport.headers['content-length']
    );

    expect(exportFileSize / 1000).toBeCloseTo(expectedExportSize, 0);

    const body = responseSnapshotExport.body as Buffer;
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
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
