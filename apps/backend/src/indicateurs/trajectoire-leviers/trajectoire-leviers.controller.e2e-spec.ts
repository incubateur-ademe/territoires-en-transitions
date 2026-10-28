import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthToken, getTestApp, getTestDatabase } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import request from 'supertest';
import { expect } from 'vitest';
import { addTestTrajectoireLeviers } from './trajectoire-leviers.test-fixture';

describe('Trajectoire Leviers Controller', () => {
  let app: INestApplication;
  let authToken: string;
  let fixture: Awaited<ReturnType<typeof addTestTrajectoireLeviers>>;
  let epciSansTrajectoire: Awaited<ReturnType<typeof addTestCollectivite>>;
  let cleanupUser: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);
    const testUserResult = await addTestUser(db);
    cleanupUser = testUserResult.cleanup;
    authToken = await getAuthToken({
      email: testUserResult.user.email ?? '',
      password: testUserResult.user.password,
    });

    fixture = await addTestTrajectoireLeviers(db);
    epciSansTrajectoire = await addTestCollectivite(db, { type: 'epci' });
  }, 30000);

  test('Lit les objectifs et résultats annuels par SIREN', async () => {
    const response = await request(app.getHttpServer())
      .get(`/trajectoires/snbc/leviers?siren=${fixture.collectivite.siren}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(response.body).toMatchObject({
      sourcesResultats: ['rare'],
      secteurs: expect.arrayContaining([
        expect.objectContaining({
          nom: 'Résidentiel',
          resultat2019: 100,
          objectif2019: 100,
          objectif2030: 60,
        }),
      ]),
    });
  });

  test("Répond 404 pour un EPCI dont la trajectoire SNBC n'a pas été calculée", async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/trajectoires/snbc/leviers?collectiviteId=${epciSansTrajectoire.collectivite.id}`
      )
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
    expect(response.body).toMatchObject({
      message: "La trajectoire SNBC de la collectivité n'a pas été calculée",
    });
  });

  afterAll(async () => {
    await fixture?.cleanup();
    await epciSansTrajectoire?.cleanup();
    await cleanupUser?.();
    await app.close();
  });
});
