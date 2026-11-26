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
import { ESTIMATE_STATUSES } from 'ademe-planet';
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

  const httpError = ({
    statusCode,
    error,
  }: {
    statusCode: number;
    error: string;
  }) => ({
    status: statusCode,
    body: { statusCode, error, message: expect.any(String) },
  });

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

  it('renvoie 400 quand le paquet juge la requête invalide', async () => {
    const response = await estimate({
      id: 'levier-inexistant',
      parameters: {},
    });

    expect({ status: response.status, body: response.body }).toEqual(
      httpError({ statusCode: 400, error: 'Bad Request' })
    );
  });

  it('renvoie 422 quand le levier n’est pas calculé au niveau demandé', async () => {
    const response = await estimate({
      id: 'transport_marchandises_report_modal',
      territory: { level: 'departement', code: '35' },
      parameters: { roadToRailFraction: '0.1', roadToWaterwayFraction: '0.05' },
    });

    expect({ status: response.status, body: response.body }).toEqual(
      httpError({ statusCode: 422, error: 'Unprocessable Entity' })
    );
  });

  it('renvoie 422 quand le paquet n’a pas de donnée pour le territoire', async () => {
    const response = await estimate({
      id: 'transport_marchandises_report_modal',
      territory: { level: 'region', code: '99' },
      parameters: { roadToRailFraction: '0.1', roadToWaterwayFraction: '0.05' },
    });

    expect({ status: response.status, body: response.body }).toEqual(
      httpError({ statusCode: 422, error: 'Unprocessable Entity' })
    );
  });

  it('renvoie 404 quand le territoire est inconnu du paquet', async () => {
    const response = await estimate({
      id: 'batiments_machines_agricoles',
      territory: { level: 'region', code: '99' },
      parameters: {
        electricityReductionFraction: '0.1',
        naturalGasReductionFraction: '0.1',
        petroleumProductsReductionFraction: '0.1',
        heatReductionFraction: '0.1',
      },
    });

    expect({ status: response.status, body: response.body }).toEqual(
      httpError({ statusCode: 404, error: 'Not Found' })
    );
  });

  it('renvoie les cinq champs de l’estimation pour un levier sans territoire', async () => {
    const response = await estimate({
      id: 'haies',
      parameters: { hedgeKmCreatedPerYear: '10' },
    });

    expect({ status: response.status, body: response.body }).toEqual({
      status: 200,
      body: {
        reduction: expect.any(String),
        status: expect.stringMatching(
          new RegExp(`^(${ESTIMATE_STATUSES.join('|')})$`)
        ),
        appliedAssumptions: expect.any(Object),
        limits: expect.any(Array),
        datasets: expect.any(Array),
      },
    });
  });
});
