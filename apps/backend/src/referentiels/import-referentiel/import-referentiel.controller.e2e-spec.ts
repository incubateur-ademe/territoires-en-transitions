import { INestApplication } from '@nestjs/common';
import TrajectoiresXlsxService from '@tet/backend/indicateurs/trajectoires/trajectoires-xlsx.service';
import { referentielDefinitionTable } from '@tet/backend/referentiels/models/referentiel-definition.table';
import {
  getTestApp,
  getTestDatabase,
  parseCsvWithSchema,
  stringFrenchNumberSchema,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import {
  findActionById,
  flatMapActionsEnfants,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { eq } from 'drizzle-orm';
import * as path from 'path';
import { default as request } from 'supertest';
import * as zCore from 'zod/v4/core';
import { importPersonnalisationQuestionSchema } from '../../collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.dto';
import { ReferentielResponse } from '../get-referentiel/get-referentiel.service';
import { importActionDefinitionSchema } from './import-action-definition.dto';

const SAMPLES_DIR = path.join(__dirname, 'samples');
const PERSONNALISATION_SAMPLES_DIR = path.join(
  __dirname,
  '../../collectivites/personnalisations/import-personnalisation-questions/samples'
);

/** Maps spreadsheet IDs (from env) to referentiel short names used in CSV filenames. */
function buildSpreadsheetIdToReferentielMap(): Record<string, string> {
  const map: Record<string, string> = {};
  if (process.env.REFERENTIEL_ECI_SHEET_ID) {
    map[process.env.REFERENTIEL_ECI_SHEET_ID] = 'eci';
  }
  if (process.env.REFERENTIEL_CAE_SHEET_ID) {
    map[process.env.REFERENTIEL_CAE_SHEET_ID] = 'cae';
  }
  if (process.env.REFERENTIEL_TE_SHEET_ID) {
    map[process.env.REFERENTIEL_TE_SHEET_ID] = 'te';
  }
  return map;
}

/**
 * Creates a mock SheetService that reads from local CSV files.
 * Routes calls based on spreadsheetId (→ referentiel) and range (→ sheet type).
 */
function createLocalSheetServiceMock(): Partial<SheetService> {
  const spreadsheetIdToReferentiel = buildSpreadsheetIdToReferentielMap();

  return {
    getDataFromSheet: vi
      .fn()
      .mockImplementation(
        async <T extends Record<string, unknown>>(
          spreadsheetId: string,
          schema: zCore.$ZodObject,
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

          // Personnalisation questions sheets
          const personnalisationSheetId =
            process.env.PERSONNALISATION_QUESTIONS_SHEET_ID;
          if (
            personnalisationSheetId &&
            spreadsheetId === personnalisationSheetId
          ) {
            if (range?.startsWith('Th')) {
              return parseCsvWithSchema<T>(
                path.join(
                  PERSONNALISATION_SAMPLES_DIR,
                  'import-personnalisation-thematiques.csv'
                ),
                schema,
                templateData
              );
            }
            if (range?.startsWith('Choix')) {
              return parseCsvWithSchema<T>(
                path.join(
                  PERSONNALISATION_SAMPLES_DIR,
                  'import-personnalisation-choices.csv'
                ),
                schema,
                templateData
              );
            }
            if (range?.startsWith('Questions')) {
              return parseCsvWithSchema<T>(
                path.join(
                  PERSONNALISATION_SAMPLES_DIR,
                  'import-personnalisation-questions.csv'
                ),
                importPersonnalisationQuestionSchema.extend({
                  ordonnancement: stringFrenchNumberSchema.optional(),
                }),
                templateData
              );
            }
            throw new Error(
              `Unsupported range for personnalisation questions: ${range}`
            );
          }

          const referentiel = spreadsheetIdToReferentiel[spreadsheetId];
          if (!referentiel) {
            throw new Error(
              `Unknown spreadsheetId ${spreadsheetId} in mock SheetService`
            );
          }

          // Preuves réglementaires sheet
          if (range?.startsWith('Preuves')) {
            const csvPath = path.join(
              SAMPLES_DIR,
              `referentiel-${referentiel}-preuves.csv`
            );
            const preuvesResult = parseCsvWithSchema<T>(
              csvPath,
              schema,
              templateData
            );
            return preuvesResult;
          }

          // Default: Structure référentiel sheet
          const csvPath = path.join(
            SAMPLES_DIR,
            `referentiel-${referentiel}-structure.csv`
          );
          const actionsResult = parseCsvWithSchema<T>(
            csvPath,
            importActionDefinitionSchema.extend({
              points: stringFrenchNumberSchema.optional(),
              pourcentage: stringFrenchNumberSchema.optional(),
            }),
            templateData
          );
          return actionsResult;
        }
      ),

    getDefaultRangeFromHeader: vi
      .fn()
      .mockImplementation((_header: string[], sheetName?: string): string => {
        return sheetName || '';
      }),
  };
}

describe('import-referentiel.controller.e2e-spec', () => {
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
  }, 30_000);

  it(`Import du referentiel ECI depuis les fichiers CSV locaux`, async () => {
    // Reset the version
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ version: '0.0.1' })
      .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.ECI));

    const importPath = `/referentiels/${ReferentielIdEnum.ECI}/import`;
    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const getReferentielResponse: ReferentielResponse = response.body;
    expect(getReferentielResponse.itemsTree.actionId).toBe(
      ReferentielIdEnum.ECI
    );

    // Check that the preuves are imported
    const foundAction = findActionById(
      getReferentielResponse.itemsTree,
      'eci_1.3.1'
    );
    expect(foundAction.preuves).toHaveLength(1);
    expect(foundAction.preuves?.[0]?.preuveId).toBe('indicateurs_eci');

    // Check that the tache are imported
    const foundTache = findActionById(
      getReferentielResponse.itemsTree,
      'eci_1.1.1.2'
    );
    expect(foundTache).toBeDefined();
    expect(foundTache.points).toBe(1.8);

    const flatActions = flatMapActionsEnfants(getReferentielResponse.itemsTree);
    console.log(`Eci actions count: ${flatActions.length}`);
    expect(flatActions.length).toBe(368);

    expect(getReferentielResponse.itemsTree.points).toBe(500);

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
  }, 60_000);

  it(`Import du referentiel CAE depuis les fichiers CSV locaux`, async () => {
    // Reset the version
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ version: '0.0.1' })
      .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.CAE));

    const importPath = `/referentiels/${ReferentielIdEnum.CAE}/import`;
    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const getReferentielResponse: ReferentielResponse = response.body;
    expect(getReferentielResponse.itemsTree.actionId).toBe(
      ReferentielIdEnum.CAE
    );

    // Check that the preuves are imported
    const foundAction = findActionById(
      getReferentielResponse.itemsTree,
      'cae_1.1.3.2'
    );
    expect(foundAction.preuves).toHaveLength(1);
    expect(foundAction.preuves?.[0]?.preuveId).toBe('etude_vulnerabiliteCC');

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
  }, 60_000);

  it(`Import du referentiel TE depuis les fichiers CSV locaux avec test du lock`, async () => {
    // Reset the version
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ version: '0.0.1' })
      .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.TE));

    const importPath = `/referentiels/${ReferentielIdEnum.TE}/import`;
    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`);
    const getReferentielResponse: ReferentielResponse = response.body;
    expect(getReferentielResponse).toMatchObject({
      version: '1.0.1',
      orderedItemTypes: expect.any(Array),
    });
    expect(getReferentielResponse.itemsTree.actionId).toBe(
      ReferentielIdEnum.TE
    );

    // Lock it
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ locked: true })
      .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.TE));

    onTestFinished(async () => {
      await databaseService.db
        .update(referentielDefinitionTable)
        .set({ locked: false })
        .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.TE));
    });

    // Import a second time the definitions, must be refused because of the lock
    const errorResponse = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(403);

    expect(errorResponse.body).toMatchObject({
      error: 'Forbidden',
      message: expect.stringMatching(
        /Le référentiel te est verrouillé, veuillez demander à un administrateur de le déverrouiller/i
      ),
      statusCode: 403,
    });
  }, 60_000);
});
