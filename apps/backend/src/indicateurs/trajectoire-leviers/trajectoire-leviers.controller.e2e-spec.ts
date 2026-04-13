import { INestApplication } from '@nestjs/common';
import { getAuthToken, getTestApp, getTestDatabase } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import request from 'supertest';
import { expect } from 'vitest';

describe('Trajectoire Leviers Controller', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);
    const testUserResult = await addTestUser(db);
    authToken = await getAuthToken({
      email: testUserResult.user.email ?? '',
      password: testUserResult.user.password,
    });
  });

  test('Get data for collectivite with siren 246700488', async () => {
    const response = await request(app.getHttpServer())
      .get('/trajectoires/snbc/leviers?siren=246700488')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    // We don't check the full response here because trajectoire may be needed, already done in router e2e spec
    expect(response.body).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
