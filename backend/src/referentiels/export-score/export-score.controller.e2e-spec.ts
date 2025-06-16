import { INestApplication } from '@nestjs/common';
import { DateTime } from 'luxon';
import { default as request } from 'supertest';
import { getTestApp } from '../../../test/app-utils';
import { getAuthToken } from '../../../test/auth-utils';

describe('Referentiels scoring routes', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getAuthToken();
  });

  test(`Export du snapshot pour un utilisateur non authentifié`, async () => {
    await request(app.getHttpServer())
      .get(
        `/collectivites/1/referentiels/eci/score-snapshots/score-courant/export`
      )
      .expect(401);
  });

  test(`Export du snapshot pour un utilisateur anonyme`, async () => {
    const responseSnapshotExport = await request(app.getHttpServer())
      .get(
        `/collectivites/1/referentiels/eci/score-snapshots/score-courant/export`
      )
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200)
      .responseType('blob');

    const currentDate = DateTime.now().toISODate();
    const exportFileName = responseSnapshotExport.headers['content-disposition']
      .split('filename=')[1]
      .split(';')[0];

    expect(exportFileName).toBe(
      `"Export_ECI_Ambe?rieu-en-Bugey_${currentDate}.xlsx"`
    );
    const expectedExportSize = 50.546;
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
});
