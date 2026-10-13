import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { categorieTagTable } from '@tet/backend/collectivites/tags/categorie-tag.table';
import {
  getDisposableTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import { AuthRole } from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import { randomUUID } from 'crypto';
import { eq, inArray } from 'drizzle-orm';
import { default as request } from 'supertest';
import * as z from 'zod/mini';
import { indicateurCategorieTagTable } from '../definitions/indicateur-categorie-tag.table';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import TrajectoiresXlsxService from '../trajectoires/trajectoires-xlsx.service';
import { indicateurObjectifTable } from '../shared/models/indicateur-objectif.table';
import { ImportIndicateurDefinitionRepository } from './import-indicateur-definition.repository';
import { sampleImportIndicateurDefinition } from './samples/import-indicateur-definition.sample';

// Runs after database seeding: disposable collectivités must not consume IDs
// before the seed scripts create the collectivités referenced by their fixtures.
describe('import-indicateur catalogue', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let anonymousToken: string;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      mockProdEnv: true,
      overrides: (builder) => {
        builder.overrideProvider(SheetService).useValue({
          getDataFromSheet: vi.fn(),
          getDefaultRangeFromHeader: (_header: string[], sheetName?: string) =>
            sheetName || '',
        });
        builder.overrideProvider(TrajectoiresXlsxService).useValue({});
      },
    });
    databaseService = await getTestDatabase(app);
    anonymousToken = signTestAuthToken(
      { role: AuthRole.ANON },
      app.get(ConfigurationService).get('SUPABASE_JWT_SECRET')
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('importe les catégories publiques et annule définitions, relations et objectifs ensemble en cas d’échec', async () => {
    const collectivites = [
      await addTestCollectivite(databaseService),
      await addTestCollectivite(databaseService),
    ];
    const prefix = `catalogue_${randomUUID().replaceAll('-', '')}`;
    const categoryName = `${prefix}_categorie`;
    const identifiants = [`${prefix}_source`, `${prefix}_calcul`];
    let version = '999.0.0';
    let categoriesToImport = [categoryName];
    let objectifIdentifiant = identifiants[0];
    let objectifFormule = '10';
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(
          inArray(
            indicateurDefinitionTable.identifiantReferentiel,
            identifiants
          )
        );
      await databaseService.db
        .delete(categorieTagTable)
        .where(eq(categorieTagTable.nom, categoryName));
      for (const collectivite of collectivites) await collectivite.cleanup();
    });
    const [localCategory] = await databaseService.db
      .insert(categorieTagTable)
      .values({
        nom: categoryName,
        collectiviteId: collectivites[0].collectivite.id,
      })
      .returning();

    // Only the external spreadsheet is substituted. Import, relations and SQL
    // use the application providers and the real database.
    const sheet = vi.spyOn(app.get(SheetService), 'getDataFromSheet');
    sheet.mockImplementation(
      async <T extends Record<string, unknown>>(
        _spreadsheetId: string,
        schema: Parameters<SheetService['getDataFromSheet']>[1],
        range?: string,
        _idProperties?: (keyof T)[],
        templateData?: Partial<T>
      ): Promise<{ data: T[]; header: string[] | null }> => {
        if (range?.startsWith('Versions')) {
          return {
            data: [
              { version, date: '2026-10-09', description: 'Fixture' },
            ] as unknown as T[],
            header: null,
          };
        }
        if (range?.startsWith('Objectifs')) {
          return {
            data: [
              {
                identifiantReferentiel: objectifIdentifiant,
                dateValeur: '2030-01-01',
                formule: objectifFormule,
              },
            ] as unknown as T[],
            header: null,
          };
        }
        if (range?.startsWith('Indicateur')) {
          return {
            data: identifiants.map((identifiantReferentiel) =>
              z.parse(schema, {
                ...sampleImportIndicateurDefinition,
                ...templateData,
                identifiantReferentiel,
                titre: identifiantReferentiel,
                categories: categoriesToImport,
                thematiques: [],
                parents: null,
                valeurCalcule: null,
              })
            ) as T[],
            header: null,
          };
        }
        throw new Error(`Unexpected sheet range: ${range}`);
      }
    );
    onTestFinished(() => sheet.mockRestore());
    const importCatalogue = () =>
      request(app.getHttpServer())
        .get('/indicateur-definitions/import')
        .set('Authorization', `Bearer ${anonymousToken}`);
    await importCatalogue().expect(200);

    const definitions = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(
        inArray(indicateurDefinitionTable.identifiantReferentiel, identifiants)
      );
    const source = definitions.find(
      (definition) => definition.identifiantReferentiel === identifiants[0]
    );
    const target = definitions.find(
      (definition) => definition.identifiantReferentiel === identifiants[1]
    );
    if (!source || !target) throw new Error('Imported definitions missing');
    const categories = await databaseService.db
      .select()
      .from(categorieTagTable)
      .where(eq(categorieTagTable.nom, categoryName));
    const publicCategories = categories.filter(
      ({ collectiviteId, groupementId }) =>
        collectiviteId === null && groupementId === null
    );
    expect(publicCategories).toHaveLength(1);
    expect(publicCategories[0].id).not.toBe(localCategory.id);
    const relations = await databaseService.db
      .select()
      .from(indicateurCategorieTagTable)
      .where(
        inArray(indicateurCategorieTagTable.indicateurId, [
          source.id,
          target.id,
        ])
      );
    expect(relations).toHaveLength(2);
    expect(
      relations.every(
        ({ categorieTagId }) => categorieTagId === publicCategories[0].id
      )
    ).toBe(true);

    const ids = [source.id, target.id];
    const readCatalogue = async () => ({
      definitions: await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(inArray(indicateurDefinitionTable.id, ids))
        .orderBy(indicateurDefinitionTable.id),
      relations: await databaseService.db
        .select()
        .from(indicateurCategorieTagTable)
        .where(inArray(indicateurCategorieTagTable.indicateurId, ids))
        .orderBy(indicateurCategorieTagTable.indicateurId),
      objectifs: await databaseService.db
        .select()
        .from(indicateurObjectifTable)
        .where(inArray(indicateurObjectifTable.indicateurId, ids))
        .orderBy(indicateurObjectifTable.indicateurId),
    });
    const before = await readCatalogue();
    expect(before.objectifs).toMatchObject([
      { indicateurId: source.id, formule: '10' },
    ]);
    version = '999.0.1';
    categoriesToImport = [];
    objectifFormule = '20';
    const repository = app.get(ImportIndicateurDefinitionRepository);
    const upsertObjectifs = repository.upsertObjectifs.bind(repository);
    // Fail after real writes, so the assertions exercise the database rollback.
    const injectedFailure = vi
      .spyOn(repository, 'upsertObjectifs')
      .mockImplementation(async (...args) => {
        await upsertObjectifs(...args);
        throw new Error('Injected failure after objective write');
      });
    onTestFinished(() => injectedFailure.mockRestore());
    await importCatalogue().expect(500);
    injectedFailure.mockRestore();
    expect(await readCatalogue()).toEqual(before);

    await importCatalogue().expect(200);
    const after = await readCatalogue();
    expect(
      after.definitions.every(({ version }) => version === '999.0.1')
    ).toBe(true);
    expect(after.relations).toEqual([]);
    expect(after.objectifs).toMatchObject([
      { indicateurId: source.id, formule: '20' },
    ]);

    version = '999.0.2';
    objectifIdentifiant = `${prefix}_inconnu`;
    await importCatalogue().expect(400);
    await request(app.getHttpServer())
      .get('/indicateur-definitions/verify')
      .set('Authorization', `Bearer ${anonymousToken}`)
      .expect(400);
    expect(await readCatalogue()).toEqual(after);
  });
});
