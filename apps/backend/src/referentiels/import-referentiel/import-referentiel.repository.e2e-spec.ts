import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@tet/backend/app.module';
import { personnalisationRegleTable } from '@tet/backend/collectivites/personnalisations/models/personnalisation-regle.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { referentielDefinitionTable } from '@tet/backend/referentiels/models/referentiel-definition.table';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import { CustomZodValidationPipe } from '@tet/backend/utils/nest/custom-zod-validation.pipe';
import VersionService from '@tet/backend/utils/version/version.service';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { eq, ilike, like } from 'drizzle-orm';
import { ImportReferentielService } from './import-referentiel.service';

const MOCK_CHANGELOG = [
  { version: '99.0.0', date: '2026-01-01', description: 'Test version' },
];

const MOCK_ACTIONS = [
  {
    identifiant: '1',
    nom: 'Axe 1',
  },
  {
    identifiant: '1.1',
    nom: 'Action avec desactivation',
    points: 10,
    desactivation: 'reponse(dechets_1, OUI)',
  },
  {
    identifiant: '1.2',
    nom: 'Action avec reduction',
    points: 20,
    reduction: 'reponse(habitat_1)',
  },
  {
    identifiant: '1.3',
    nom: 'Action avec deux questions',
    points: 30,
    desactivation:
      'si reponse(dechets_1, NON) et reponse(habitat_1, OUI) alors desactivation',
  },
  {
    identifiant: '1.4',
    nom: 'Action sans expression',
    points: 40,
  },
];

const MOCK_ACTIONS_NO_EXPRESSIONS = [
  {
    identifiant: '1',
    nom: 'Axe 1',
  },
  {
    identifiant: '1.1',
    nom: 'Action simple',
    points: 10,
  },
];

function createMockSheetService(actions = MOCK_ACTIONS) {
  return {
    getDataFromSheet: async (
      _spreadsheetId: string,
      _schema: unknown,
      range?: string
    ) => {
      // Distinguish calls by range
      if (range?.startsWith('Versions')) {
        return { data: MOCK_CHANGELOG, header: null };
      }
      if (range?.startsWith('Structure')) {
        return { data: actions, header: null };
      }
      // Preuve definitions or any other sheet → empty
      return { data: [], header: null };
    },
    getRawDataFromSheet: vi.fn().mockResolvedValue({ data: null }),
    getFileData: vi.fn().mockResolvedValue(null),
    getAuthClient: vi.fn().mockResolvedValue({}),
    executeWithQuotaRetry: async (
      fn: (bail: (e: Error) => void, num: number) => Promise<void>
    ) => fn(() => {}, 1),
    overwriteTypedDataToSheet: vi.fn().mockResolvedValue(undefined),
    overwriteRawDataToSheet: vi.fn().mockResolvedValue(undefined),
    getFileName: vi.fn().mockResolvedValue(''),
    getFileIdByName: vi.fn().mockResolvedValue(null),
    copyFile: vi.fn().mockResolvedValue(''),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    downloadFile: vi.fn().mockResolvedValue(undefined),
    getDefaultRangeFromHeader: vi.fn().mockResolvedValue('A:Z'),
    getMimeTypeFromFileName: vi.fn().mockResolvedValue(''),
    getRecordRowToWrite: vi.fn().mockResolvedValue([]),
  };
}

describe.skip('ImportReferentielRepository e2e - question-action from expressions', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let importReferentielService: ImportReferentielService;

  const referentielId = ReferentielIdEnum.ECI;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SheetService)
      .useValue(createMockSheetService())
      .overrideProvider(VersionService)
      .useValue({
        getVersion: () => ({ environment: 'test' }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    const contextStoreService = app.get(ContextStoreService);
    app.useGlobalPipes(new CustomZodValidationPipe(contextStoreService));

    await app.init();

    databaseService = app.get(DatabaseService);
    importReferentielService = app.get(ImportReferentielService);
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Reset the version to allow import
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ version: '0.0.1' })
      .where(eq(referentielDefinitionTable.id, referentielId));
  });

  it('populates question_action from expressions instead of spreadsheet column', async () => {
    await importReferentielService.importReferentiel(referentielId);

    const questionActions = await databaseService.db
      .select()
      .from(questionActionTable)
      .where(ilike(questionActionTable.actionId, `${referentielId}_%`));

    expect(questionActions).toEqual(
      expect.arrayContaining([
        { actionId: `${referentielId}_1.1`, questionId: 'dechets_1' },
        { actionId: `${referentielId}_1.2`, questionId: 'habitat_1' },
        { actionId: `${referentielId}_1.3`, questionId: 'dechets_1' },
        { actionId: `${referentielId}_1.3`, questionId: 'habitat_1' },
      ])
    );
    expect(questionActions).toHaveLength(4);
  }, 30_000);

  it('populates personnalisation_regle from expressions', async () => {
    await importReferentielService.importReferentiel(referentielId);

    const regles = await databaseService.db
      .select()
      .from(personnalisationRegleTable)
      .where(like(personnalisationRegleTable.actionId, `${referentielId}_%`));

    expect(regles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: `${referentielId}_1.1`,
          type: 'desactivation',
          formule: 'reponse(dechets_1, OUI)',
        }),
        expect.objectContaining({
          actionId: `${referentielId}_1.2`,
          type: 'reduction',
          formule: 'reponse(habitat_1)',
        }),
        expect.objectContaining({
          actionId: `${referentielId}_1.3`,
          type: 'desactivation',
          formule:
            'si reponse(dechets_1, NON) et reponse(habitat_1, OUI) alors desactivation',
        }),
      ])
    );
    expect(regles).toHaveLength(3);
  }, 30_000);
});

describe.skip('ImportReferentielRepository e2e - import with no expressions', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let importReferentielService: ImportReferentielService;

  const referentielId = ReferentielIdEnum.ECI;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SheetService)
      .useValue(createMockSheetService(MOCK_ACTIONS_NO_EXPRESSIONS))
      .overrideProvider(VersionService)
      .useValue({
        getVersion: () => ({ environment: 'test' }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    const contextStoreService = app.get(ContextStoreService);
    app.useGlobalPipes(new CustomZodValidationPipe(contextStoreService));

    await app.init();

    databaseService = app.get(DatabaseService);
    importReferentielService = app.get(ImportReferentielService);
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ version: '0.0.1' })
      .where(eq(referentielDefinitionTable.id, referentielId));
  });

  it('succeeds when actions have no expressions (empty personnalisation rules and question actions)', async () => {
    await importReferentielService.importReferentiel(referentielId);

    const regles = await databaseService.db
      .select()
      .from(personnalisationRegleTable)
      .where(like(personnalisationRegleTable.actionId, `${referentielId}_%`));

    const questionActions = await databaseService.db
      .select()
      .from(questionActionTable)
      .where(ilike(questionActionTable.actionId, `${referentielId}_%`));

    expect(regles).toHaveLength(0);
    expect(questionActions).toHaveLength(0);
  }, 30_000);
});
