import { getTestApp } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { ISO_8601_DATE_TIME_REGEX } from '../../../test/vitest-matchers';

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
      status: 500,
      message: 'This is a an api test error',
      timestamp: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      path: '/throw',
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
