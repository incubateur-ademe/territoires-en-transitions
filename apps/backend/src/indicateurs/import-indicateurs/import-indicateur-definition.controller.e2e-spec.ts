import { INestApplication } from '@nestjs/common';
import {
  getDisposableTestApp,
  getTestDatabase,
  parseCsvWithSchema,
  signTestAuthToken,
  stringFrenchNumberSchema,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { AuthRole } from '@tet/backend/users/models/auth.models';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import { sql } from 'drizzle-orm';
import * as path from 'path';
import { default as request } from 'supertest';
import * as z from 'zod/mini';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import TrajectoiresXlsxService from '../trajectoires/trajectoires-xlsx.service';
import { importIndicateurDefinitionSchema } from './import-indicateur-definition.dto';

/**
 * Creates a mock SheetService that reads from local CSV files.
 * Routes calls based on the range parameter to the appropriate CSV file.
 */
function createLocalSheetServiceMock(): Partial<SheetService> {
  return {
    getDataFromSheet: vi
      .fn()
      .mockImplementation(
        async <T extends Record<string, unknown>>(
          _spreadsheetId: string,
          schema: Parameters<SheetService['getDataFromSheet']>[1],
          range?: string,
          idProperties?: (keyof T)[],
          templateData?: Partial<T>
        ): Promise<{ data: T[]; header: string[] | null }> => {
          // Changelog / Versions sheet
          if (range?.startsWith('Versions')) {
            const data = [
              { version: '1.0.1', date: '2026-04-01', description: 'Test' },
            ] as unknown as T[];
            return { data, header: ['version', 'date', 'description'] };
          }

          // Objectifs sheet
          if (range?.startsWith('Objectifs')) {
            const csvPath = path.join(
              __dirname,
              './samples/import-indicateur-objectifs.csv'
            );
            return parseCsvWithSchema<T>(csvPath, schema, templateData);
          }

          if (range?.startsWith('Indicateur')) {
            const csvPath = path.join(
              __dirname,
              './samples/import-indicateur-definitions.csv'
            );
            return parseCsvWithSchema<T>(
              csvPath,
              z.extend(importIndicateurDefinitionSchema, {
                precision: stringFrenchNumberSchema.optional(),
                borneMin: stringFrenchNumberSchema.nullable().optional(),
                borneMax: stringFrenchNumberSchema.nullable().optional(),
                participationScore: z.optional(
                  z.transform(
                    (value) => value?.toString().toLowerCase() === 'true'
                  )
                ),
                sansValeurUtilisateur: z.optional(
                  z.transform(
                    (value) => value?.toString().toLowerCase() === 'true'
                  )
                ),
              }),
              templateData
            );
          }

          throw new Error(`Unknown range ${range} in mock SheetService`);
        }
      ),

    getDefaultRangeFromHeader: vi
      .fn()
      .mockImplementation((_header: string[], sheetName?: string): string => {
        return sheetName || '';
      }),
  };
}

describe('import-indicateur-definition.controller.e2e-spec', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let serviceRoleToken: string;
  let authenticatedUserToken: string;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      mockProdEnv: true,
      overrides: (builder) => {
        builder
          .overrideProvider(SheetService)
          .useValue(createLocalSheetServiceMock());
        builder.overrideProvider(TrajectoiresXlsxService).useValue({});
      },
    });
    databaseService = await getTestDatabase(app);
    const jwtSecret = app.get(ConfigurationService).get('SUPABASE_JWT_SECRET');
    serviceRoleToken = signTestAuthToken(
      { role: AuthRole.SERVICE_ROLE },
      jwtSecret
    );
    authenticatedUserToken = signTestAuthToken(
      {
        role: AuthRole.AUTHENTICATED,
        sub: '00000000-0000-4000-8000-000000000001',
      },
      jwtSecret
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['/indicateur-definitions/import', 'post'],
    ['/indicateur-definitions/verify', 'get'],
  ] as const)('refuse l’accès anonyme à %s', async (url, method) => {
    const anonymousRequest = request(app.getHttpServer());
    const withoutToken =
      method === 'post'
        ? anonymousRequest.post(url)
        : anonymousRequest.get(url);
    await withoutToken.expect(401);

    const anonymousTokenRequest = request(app.getHttpServer());
    const withAnonymousToken =
      method === 'post'
        ? anonymousTokenRequest.post(url)
        : anonymousTokenRequest.get(url);
    await withAnonymousToken
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(401);
  });

  it.each([
    ['/indicateur-definitions/import', 'post'],
    ['/indicateur-definitions/verify', 'get'],
  ] as const)('réserve %s au service role', async (url, method) => {
    const authenticatedRequest = request(app.getHttpServer());
    const response =
      method === 'post'
        ? authenticatedRequest.post(url)
        : authenticatedRequest.get(url);
    await response
      .set('Authorization', `Bearer ${authenticatedUserToken}`)
      .expect(403);
  });

  it(`Importe les indicateurs depuis le fichier CSV local`, async () => {
    // Reset the version
    await databaseService.db
      .update(indicateurDefinitionTable)
      .set({ version: '1.0.0' })
      .where(sql`TRUE`);

    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .post(`/indicateur-definitions/import`)
      .set('Authorization', `Bearer ${serviceRoleToken}`);
    expect(response.body).toMatchObject({
      status: 'committed',
      definitions: expect.any(Array),
      reconciliation: {
        status: expect.stringMatching(/complete|pending|failed/),
      },
    });
    expect(response.body.definitions).toBeInstanceOf(Array);
    expect(response.status).toBe(200);
    expect(response.body.definitions.length).toBeGreaterThan(0);

    // Import a second time the definitions, must be refused because the version is the same
    const errorResponse = await request(app.getHttpServer())
      .post(`/indicateur-definitions/import`)
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .expect(422);

    expect(errorResponse.body).toMatchObject({
      error: 'Unprocessable Entity',
      message: expect.stringMatching(
        /please add a new version in the changelog/i
      ),
      statusCode: 422,
    });
  }, 30000);

  it(`N'expose plus l'import en GET`, async () => {
    await request(app.getHttpServer())
      .get(`/indicateur-definitions/import`)
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .expect(404);
  });

  it(`Vérifie les formules des indicateurs depuis le fichier CSV local`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateur-definitions/verify`)
      .set('Authorization', `Bearer ${serviceRoleToken}`);
    expect(response.body).toMatchObject({
      ok: true,
    });
  }, 10000);
});
