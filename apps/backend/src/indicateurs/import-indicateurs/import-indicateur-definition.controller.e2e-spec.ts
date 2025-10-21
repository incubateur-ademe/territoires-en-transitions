import { getTestApp, getTestDatabase } from '@/backend/test';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { INestApplication } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { default as request } from 'supertest';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';

describe('import-indicateur-definition.controller.e2e-spec', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp({
      // simule l'env. de prod pour tester que l'on ne peut pas écraser la version courante
      mockProdEnv: true,
    });
    databaseService = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  it(`Import des indicateurs depuis le spreadsheet`, async () => {
    // Reset the version
    await databaseService.db
      .update(indicateurDefinitionTable)
      .set({ version: '1.0.0' })
      .where(sql`TRUE`);

    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .get(`/indicateur-definitions/import`)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`);
    expect(response.body).toMatchObject({
      definitions: expect.any(Array),
    });
    expect(response.body.definitions).toBeInstanceOf(Array);
    expect(response.status).toBe(200);
    expect(response.body.definitions.length).toBeGreaterThan(0);

    // Import a second time the definitions, must be refused because the version is the same
    const errorResponse = await request(app.getHttpServer())
      .get(`/indicateur-definitions/import`)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(422);

    expect(errorResponse.body).toMatchObject({
      error: 'Unprocessable Entity',
      message: expect.stringMatching(
        /please add a new version in the changelog/i
      ),
      statusCode: 422,
    });
  }, 10000); // 10 seconds timeout to allow the import to complete

  it(`Vérfie les formules des indicateurs depuis le spreadsheet`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateur-definitions/verify`)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`);
    expect(response.body).toMatchObject({
      ok: true,
    });
  }, 10000); // 10 seconds timeout to allow the import to complete
});
