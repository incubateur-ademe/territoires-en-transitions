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

describe('POST /planet/solutions', () => {
  let app: INestApplication;
  let token: string;

  const solve = (body: object) =>
    request(app.getHttpServer())
      .post('/planet/solutions')
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
      .post('/planet/solutions')
      .send({
        id: 'haies',
        parameter: 'hedgeKmCreatedPerYear',
        targetReduction: '117',
      })
      .expect(401);
  });

  it('refuse un corps sans paramètre cherché', async () => {
    await solve({ id: 'haies', targetReduction: '117' }).expect(400);
  });

  it('refuse un corps sans réduction cible', async () => {
    await solve({ id: 'haies', parameter: 'hedgeKmCreatedPerYear' }).expect(
      400
    );
  });

  it('renvoie 400 quand le paquet juge la requête invalide', async () => {
    const response = await solve({
      id: 'haies',
      parameter: 'parametre-inexistant',
      targetReduction: '117',
    });

    expect({ status: response.status, body: response.body }).toEqual(
      httpError({ statusCode: 400, error: 'Bad Request' })
    );
  });

  it('renvoie 422 quand la cible est hors d’atteinte', async () => {
    const response = await solve({
      id: 'batiments_machines_agricoles',
      territory: { level: 'region', code: '84' },
      parameters: {
        naturalGasReductionFraction: '0.1',
        petroleumProductsReductionFraction: '0.1',
        heatReductionFraction: '0.1',
      },
      parameter: 'electricityReductionFraction',
      targetReduction: '999999999',
    });

    expect({ status: response.status, body: response.body }).toEqual(
      httpError({ statusCode: 422, error: 'Unprocessable Entity' })
    );
  });

  it('renvoie le paramètre trouvé et l’estimation correspondante', async () => {
    const response = await solve({
      id: 'haies',
      parameter: 'hedgeKmCreatedPerYear',
      targetReduction: '117',
    });

    expect({ status: response.status, body: response.body }).toEqual({
      status: 200,
      body: {
        parameter: 'hedgeKmCreatedPerYear',
        value: expect.any(String),
        estimate: {
          reduction: expect.any(String),
          status: expect.stringMatching(
            new RegExp(`^(${ESTIMATE_STATUSES.join('|')})$`)
          ),
          appliedAssumptions: expect.any(Object),
          limits: expect.any(Array),
          datasets: expect.any(Array),
        },
      },
    });
  });
});
