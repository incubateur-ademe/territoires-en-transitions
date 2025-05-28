import { getTestApp, signInWith, YOLO_DODO } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect } from 'vitest';

describe('Téléchargement de la trajectoire SNBC', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();

    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
  });

  test(`Telechargement du modele`, () => {
    return request(app.getHttpServer())
      .get('/trajectoires/snbc/modele') // Accès public, pas la peine de mettre le token
      .expect(200);
  }, 30000);

  test(`Téléchargement du fichier xlsx prérempli pour un epci avec donnees completes`, async () => {
    const response = await request(app.getHttpServer())
      .get('/trajectoires/snbc/telechargement?collectiviteId=4936')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .responseType('blob');

    const fileName = response.headers['content-disposition']
      .split('filename=')[1]
      .split(';')[0];
    expect(fileName).toBe(
      '"Trajectoire SNBC - 246700488 - Eurome?tropole de Strasbourg.xlsx"'
    );
  }, 30000);

  afterAll(async () => {
    await app.close();
  });
});
