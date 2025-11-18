import { INestApplication } from '@nestjs/common';
import { getAuthToken, getTestApp, YULU_DUDU } from '@tet/backend/test';
import { default as request } from 'supertest';

const SEED_DATA_PLAN_ID = 1;

describe('generate-reports.controller.e2e-spec.ts', () => {
  let app: INestApplication;
  let yoloDodoToken: string;
  let yuluDuduToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getAuthToken();
    yuluDuduToken = await getAuthToken(YULU_DUDU);
  });

  it('Génère un rapport de plan au format PPTX', async () => {
    const response = await request(app.getHttpServer())
      .post('/reports/generate')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send({
        planId: SEED_DATA_PLAN_ID,
        templateKey: 'general_bilan_template',
      })
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
      /^Rapport_Amberieu-en-Bugey_Plan Velo 2020-2024.*\.pptx$/
    );
    // Vérifie que le fichier a une taille raisonnable (rapport PPTX)
    expect(body.byteLength).toBeGreaterThan(1000);
  });

  it("Refuse la génération de rapport si l'utilisateur n'a pas les droits", async () => {
    const response = await request(app.getHttpServer())
      .post('/reports/generate')
      .set('Authorization', `Bearer ${yuluDuduToken}`)
      .send({
        planId: SEED_DATA_PLAN_ID,
        templateKey: 'general_bilan_template',
      })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: 'UNAUTHORIZED',
    });
  });
});
