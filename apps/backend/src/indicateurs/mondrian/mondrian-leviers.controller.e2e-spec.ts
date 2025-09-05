import { getAuthToken, getTestApp } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect } from 'vitest';

describe('Mondrian Leviers Controller', () => {
  let app: INestApplication;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    yoloDodoToken = await getAuthToken();
  });

  test('Get data for collectivite with siren 246700488', async () => {
    const response = await request(app.getHttpServer())
      .get('/trajectoires/snbc/leviers?siren=246700488')
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);
    // We don't check the full response here because trajectoire may be needed, already done in router e2e spec
    expect(response.body).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
