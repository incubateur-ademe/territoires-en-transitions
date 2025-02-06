import { getAuthToken, getTestApp, getTestDatabase } from '@/backend/test';
import { DatabaseService } from '@/backend/utils';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { default as request } from 'supertest';
import { collectiviteTable } from '../../collectivites';
import { UpsertIndicateursValeursRequest } from '../shared/models/upsert-indicateurs-valeurs.request';

const collectiviteId = 3;

describe('Indicateurs', () => {
  let app: INestApplication;
  let yoloDodoToken: string;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getAuthToken();
    databaseService = await getTestDatabase(app);

    await databaseService.db
      .update(collectiviteTable)
      .set({ accessRestreint: false })
      .where(eq(collectiviteTable.id, collectiviteId));

    return async () => {
      await databaseService.db
        .update(collectiviteTable)
        .set({ accessRestreint: false })
        .where(eq(collectiviteTable.id, collectiviteId));

      await app.close();
    };
  });


  it(`Lecture sans acces`, async () => {
    // on peut lire les valeurs en mode visite
    await request(app.getHttpServer())
      .get(`/indicateurs?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .expect({
        indicateurs: [],
      });

    // mais pas si la collectivité est en accès restreint
    await databaseService.db
      .update(collectiviteTable)
      .set({ accessRestreint: true })
      .where(eq(collectiviteTable.id, collectiviteId));

    return request(app.getHttpServer())
      .get(`/indicateurs?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(401)
      .expect({
        message: `Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.lecture sur la ressource Collectivité ${collectiviteId}`,
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
