import { getTestApp } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';

describe('Version controller', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it(`Test throw`, async () => {
    const response = await request(app.getHttpServer())
      .get('/throw')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(500);

    expect(response.body).toMatchObject({
      message: 'This is a an api test error',
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
