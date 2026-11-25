import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { CollectiviteRole } from '@tet/domain/users';
import { default as request } from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('POST /planet/estimations', () => {
  let app: INestApplication;
  let token: string;

  const estimate = (body: object) =>
    request(app.getHttpServer())
      .post('/planet/estimations')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);
    const { user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const authUser = getAuthUserFromUserCredentials(user);
    token = signTestAuthToken(
      { ...authUser.jwtPayload, sub: authUser.id },
      app.get(ConfigurationService).get('SUPABASE_JWT_SECRET')
    );

    return async () => {
      await app.close();
    };
  });

  it('refuse une requête sans authentification', async () => {
    await request(app.getHttpServer())
      .post('/planet/estimations')
      .send({ id: 'haies', parameters: {} })
      .expect(401);
  });

  it('refuse un corps sans identifiant de levier', async () => {
    await estimate({ parameters: {} }).expect(400);
  });

  it('refuse un identifiant de levier vide', async () => {
    await estimate({ id: '', parameters: {} }).expect(400);
  });

  it('refuse un niveau de territoire inconnu', async () => {
    await estimate({
      id: 'haies',
      territory: { level: 'commune', code: '75056' },
      parameters: {},
    }).expect(400);
  });

  it('renvoie 400 pour un levier inconnu', async () => {
    const response = await estimate({
      id: 'levier-inexistant',
      parameters: {},
    }).expect(400);

    expect(response.body).toMatchObject({
      message: expect.stringContaining('Requête invalide'),
    });
  });

  it('renvoie 422 pour un département sans donnée', async () => {
    const response = await estimate({
      id: 'transport_marchandises_report_modal',
      territory: { level: 'departement', code: '00' },
      parameters: { roadToRailFraction: '0.1', roadToWaterwayFraction: '0.05' },
    });

    expect(response.status).toBe(422);
  });

  it('renvoie 422 pour un levier non calculé au niveau EPCI', async () => {
    const response = await estimate({
      id: 'transport_marchandises_report_modal',
      territory: { level: 'epci', code: '000000000' },
      parameters: { roadToRailFraction: '0.1', roadToWaterwayFraction: '0.05' },
    });

    expect(response.status).toBe(422);
  });

  it('renvoie une estimation complète pour le levier haies sans territoire', async () => {
    const response = await estimate({
      id: 'haies',
      parameters: { hedgeKmCreatedPerYear: '10' },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      reduction: '11.7',
      status: 'no_open_question',
      appliedAssumptions: {},
      limits: [expect.objectContaining({ limit: 'Rabais régionaux absents' })],
      datasets: [],
    });
  });

  it('détaille les paramètres manquants du levier quand parameters est omis', async () => {
    const response = await estimate({ id: 'haies' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message:
        'Requête invalide : parameters.hedgeKmCreatedPerYear (Invalid input)',
    });
  });
});
