import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { UpsertIndicateursValeursRequest } from '../../src/indicateurs/models/upsert-indicateurs-valeurs.request';
import { getAuthToken } from '../auth/auth-utils';
import { getTestApp } from '../common/app-utils';

describe('Route de lecture / ecriture des indicateurs', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getAuthToken();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`Lecture sans acces`, () => {
    return request(app.getHttpServer())
      .get('/indicateurs?collectiviteId=3')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: 'Droits insuffisants',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });

  it(`Ecriture sans acces (uniquement lecture sur un des deux)`, () => {
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: 4936,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 447868,
        },
        {
          collectiviteId: 3895,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 54086,
        },
      ],
    };
    return request(app.getHttpServer())
      .post('/indicateurs')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .send(indicateurValeurPayload)
      .expect(401)
      .expect({
        message: 'Droits insuffisants',
        error: 'Unauthorized',
        statusCode: 401,
      });
  });
});
