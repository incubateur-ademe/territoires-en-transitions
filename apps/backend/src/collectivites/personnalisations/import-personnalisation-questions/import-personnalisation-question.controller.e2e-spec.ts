import { INestApplication } from '@nestjs/common';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import TrajectoiresXlsxService from '@tet/backend/indicateurs/trajectoires/trajectoires-xlsx.service';
import {
  getTestApp,
  getTestDatabase,
  parseCsvWithSchema,
  stringFrenchNumberSchema,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import { QuestionWithChoices } from '@tet/domain/collectivites';
import * as path from 'path';
import { default as request } from 'supertest';
import * as zCore from 'zod/v4/core';
import {
  importPersonnalisationCompetenceSchema,
  importPersonnalisationQuestionSchema,
} from './import-personnalisation-question.dto';

const SAMPLES_DIR = path.join(__dirname, 'samples');

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
          schema: zCore.$ZodObject,
          range?: string,
          idProperties?: (keyof T)[],
          templateData?: Partial<T>
        ): Promise<{ data: T[]; header: string[] | null }> => {
          // Changelog / Versions sheet
          if (range?.startsWith('Versions')) {
            const data = [
              {
                version: '1.0.2',
                date: '2026-04-01',
                description: 'Test',
              },
            ] as unknown as T[];
            return { data, header: ['version', 'date', 'description'] };
          }

          // Thématiques sheet
          if (range?.startsWith('Th')) {
            const csvPath = path.join(
              SAMPLES_DIR,
              'import-personnalisation-thematiques.csv'
            );
            return parseCsvWithSchema<T>(csvPath, schema, templateData);
          }

          // Choix sheet
          if (range?.startsWith('Choix')) {
            const csvPath = path.join(
              SAMPLES_DIR,
              'import-personnalisation-choices.csv'
            );
            return parseCsvWithSchema<T>(csvPath, schema, templateData);
          }

          // Competences sheet
          if (range?.startsWith('Compétences Banatic')) {
            const csvPath = path.join(
              SAMPLES_DIR,
              'import-personnalisation-competences.csv'
            );
            return parseCsvWithSchema<T>(
              csvPath,
              importPersonnalisationCompetenceSchema,
              templateData
            );
          }

          if (range?.startsWith('Questions')) {
            const csvPath = path.join(
              SAMPLES_DIR,
              'import-personnalisation-questions.csv'
            );
            return parseCsvWithSchema<T>(
              csvPath,
              importPersonnalisationQuestionSchema.extend({
                ordonnancement: stringFrenchNumberSchema.optional(),
              }),
              templateData
            );
          }

          throw new Error(`Unsupported range in mock SheetService: ${range}`);
        }
      ),

    getDefaultRangeFromHeader: vi
      .fn()
      .mockImplementation((_header: string[], sheetName?: string): string => {
        return sheetName || '';
      }),
  };
}

describe('import-personnalisation-question.controller', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp({
      mockProdEnv: true,
      overrides: (builder) => {
        builder
          .overrideProvider(SheetService)
          .useValue(createLocalSheetServiceMock());
        builder.overrideProvider(TrajectoiresXlsxService).useValue({});
      },
    });
    databaseService = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  it(`Import des questions de personnalisation depuis les fichiers CSV locaux`, async () => {
    // Reset the version
    await databaseService.db.update(questionTable).set({ version: '0.0.1' });

    const importPath = `/personnalisation-questions/import`;
    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);

    const question = (response.body.questions as QuestionWithChoices[])?.find(
      (question) => question.id === 'EP_1'
    );
    expect(question).toMatchObject({
      id: 'EP_1',
      thematiqueId: 'energie',
      ordonnancement: null,
      typesCollectivitesConcernees: null,
      type: 'choix',
      description: '',
      formulation:
        'La collectivité a-t-elle la compétence "éclairage public" ?',
      version: expect.any(String),
      choix: [
        {
          id: 'EP_1_a',
          ordonnancement: null,
          formulation: "Oui sur l'ensemble du territoire",
        },
        {
          id: 'EP_1_b',
          ordonnancement: null,
          formulation:
            "Oui partiellement (uniquement sur les zones d'intérêt communautaire par exemple)",
        },
        {
          id: 'EP_1_c',
          ordonnancement: null,
          formulation: 'Non pas du tout',
        },
      ],
    });

    // Import a second time the definitions, must be refused because the version is the same
    const errorResponse = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(422);

    expect(errorResponse.body).toMatchObject({
      error: 'Unprocessable Entity',
      message: expect.stringMatching(
        /please add a new version in the changelog/i
      ),
      statusCode: 422,
    });
  }, 20000);
});
