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
  let anonymousToken: string;

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
    anonymousToken = signTestAuthToken({ role: AuthRole.ANON }, jwtSecret);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(['import', 'verify'])(
    'refuse GET /%s sans jeton valide',
    async (route) => {
      await request(app.getHttpServer())
        .get(`/indicateur-definitions/${route}`)
        .expect(401);
      await request(app.getHttpServer())
        .get(`/indicateur-definitions/${route}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    }
  );

  it(`Importe le catalogue configuré avec le jeton anonyme de Google Sheets`, async () => {
    // Reset the version
    await databaseService.db
      .update(indicateurDefinitionTable)
      .set({ version: '1.0.0' })
      .where(sql`TRUE`);

    // Only the configured sheet is imported; a caller cannot select another source.
    const response = await request(app.getHttpServer())
      .get(`/indicateur-definitions/import`)
      .query({ spreadsheetId: 'untrusted-sheet' })
      .set('Authorization', `Bearer ${anonymousToken}`);
    expect(response.body).toMatchObject({
      definitions: expect.any(Array),
      identifiantsRecalcules: expect.any(Array),
    });
    expect(response.body.definitions).toBeInstanceOf(Array);
    expect(response.status).toBe(200);
    expect(response.body.definitions.length).toBeGreaterThan(0);

    // Import a second time the definitions, must be refused because the version is the same
    const errorResponse = await request(app.getHttpServer())
      .get(`/indicateur-definitions/import`)
      .set('Authorization', `Bearer ${anonymousToken}`)
      .expect(422);

    expect(errorResponse.body).toMatchObject({
      error: 'Unprocessable Entity',
      message: expect.stringMatching(
        /please add a new version in the changelog/i
      ),
      statusCode: 422,
    });
  }, 30000);

  it(`Vérifie les formules des indicateurs depuis le fichier CSV local`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateur-definitions/verify`)
      .set('Authorization', `Bearer ${anonymousToken}`);
    expect(response.body).toMatchObject({
      ok: true,
    });
  }, 10000);

});
