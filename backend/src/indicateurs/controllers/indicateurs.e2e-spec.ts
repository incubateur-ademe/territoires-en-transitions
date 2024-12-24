import { getAuthToken, getTestApp } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { UpsertIndicateursValeursRequest } from '../models/upsert-indicateurs-valeurs.request';

describe('Indicateurs', () => {
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
        message:
          "Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.lecture sur la ressource Collectivité 3",
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
        message:
          "Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.edition sur la ressource Collectivité 3895",
        error: 'Unauthorized',
        statusCode: 401,
      });
  });
});
