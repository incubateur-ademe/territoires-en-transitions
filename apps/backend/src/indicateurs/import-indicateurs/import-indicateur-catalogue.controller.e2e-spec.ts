import { IndicateurReferenceExterneRepository } from '../indicateur/indicateur-reference-externe.repository';
import { indicateurReferenceExterneTable } from '../indicateur/indicateur-reference-externe.table';
import { ImportIndicateurReference } from './import-indicateur-reference.dto';
import { indicateurReferencesSheet } from './import-indicateur-reference.dto';
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
import { indicateurCategorieTagTable } from '../indicateur/indicateur-categorie-tag.table';
import { indicateurDefinitionTable } from '../indicateur/indicateur-definition.table';
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
  const lienSource = 'https://grist.numerique.gouv.fr/test-catalogue';

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
    let references: ImportIndicateurReference[] = [
      {
        source: prefix,
        lienSource,
        codeExterne: 'compteur',
        identifiantReferentiel: identifiants[0],
      },
    ];
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
        if (range === indicateurReferencesSheet.range)
          return {
            data: references as unknown as T[],
            header: [...indicateurReferencesSheet.headers],
          };
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
    const readReferences = () =>
      app.get(IndicateurReferenceExterneRepository).list([prefix]);
    const beforeReferences = await readReferences();
    expect(beforeReferences).toMatchObject([
      {
        codeExterne: 'compteur',
        identifiantReferentiel: identifiants[0],
        version,
      },
    ]);
    const before = await readCatalogue();
    expect(before.objectifs).toMatchObject([
      { indicateurId: source.id, formule: '10' },
    ]);
    version = '999.0.1';
    references = [
      {
        source: prefix,
        lienSource,
        codeExterne: 'nouveau',
        identifiantReferentiel: identifiants[1],
      },
    ];
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
    expect(await readReferences()).toEqual(beforeReferences);

    await importCatalogue().expect(200);
    const after = await readCatalogue();
    expect(await readReferences()).toMatchObject([
      {
        codeExterne: 'nouveau',
        identifiantReferentiel: identifiants[1],
        version,
      },
    ]);
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
  it('vérifie les références sans écrire, refuse les ambiguïtés et retire uniquement les liens des définitions importées', async () => {
    const source = `references_${randomUUID()}`;
    const identifiers = [source + '_a', source + '_b'];
    let references: ImportIndicateurReference[] = [
      {
        source,
        lienSource,
        codeExterne: 'A',
        identifiantReferentiel: identifiers[0],
      },
      {
        source,
        lienSource,
        codeExterne: 'B',
        identifiantReferentiel: identifiers[0],
      },
      {
        source: source + '_autre',
        lienSource,
        codeExterne: 'A',
        identifiantReferentiel: identifiers[1],
      },
      { source, lienSource, codeExterne: 'a-completer' },
    ];
    let referencesUnavailable = false;
    const documentation: Record<string, string> = {
      observation: 'Correspondance à relire',
      lienDefinitionTeT: 'https://example.com/definition',
    };
    let header: string[] = [
      ...indicateurReferencesSheet.headers,
      ...Object.keys(documentation),
    ];
    let version = '999.0.0';
    let importedIdentifiers = identifiers;
    const referenceReader = new SheetService();
    vi.spyOn(referenceReader, 'getRawDataFromSheet').mockImplementation(
      async () => ({
        data: [
          header,
          ...references.map((reference) =>
            header.map(
              (field) =>
                reference[field as keyof ImportIndicateurReference] ??
                documentation[field] ??
                ''
            )
          ),
        ],
      })
    );
    const sheet = vi
      .spyOn(app.get(SheetService), 'getDataFromSheet')
      .mockImplementation(
        async <T extends Record<string, unknown>>(
          _id: string,
          schema: Parameters<SheetService['getDataFromSheet']>[1],
          range?: string,
          _ids?: (keyof T)[],
          template?: Partial<T>
        ): Promise<{ data: T[]; header: string[] | null }> => {
          if (range === indicateurReferencesSheet.range) {
            if (referencesUnavailable)
              throw new Error('References sheet unavailable');
            return referenceReader.getDataFromSheet<T>(_id, schema, range);
          }
          if (range?.startsWith('Versions'))
            return { data: [{ version }] as unknown as T[], header: null };
          if (range?.startsWith('Objectifs')) return { data: [], header: null };
          if (range?.startsWith('Indicateur'))
            return {
              data: importedIdentifiers.map((identifiantReferentiel) =>
                z.parse(schema, {
                  ...sampleImportIndicateurDefinition,
                  ...template,
                  identifiantReferentiel,
                  categories: [],
                  thematiques: [],
                  parents: null,
                  valeurCalcule: null,
                })
              ) as T[],
              header: null,
            };
          throw new Error(`Unexpected range: ${range}`);
        }
      );
    onTestFinished(async () => {
      sheet.mockRestore();
      await databaseService.db
        .delete(indicateurReferenceExterneTable)
        .where(
          inArray(indicateurReferenceExterneTable.source, [
            source,
            source + '_autre',
          ])
        );
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(
          inArray(indicateurDefinitionTable.identifiantReferentiel, identifiers)
        );
    });
    const call = (action: 'verify' | 'import') =>
      request(app.getHttpServer())
        .get(`/indicateur-definitions/${action}`)
        .set('Authorization', `Bearer ${anonymousToken}`);
    const repository = app.get(IndicateurReferenceExterneRepository);
    const read = () => repository.list([source]);
    await call('verify').expect(200);
    expect(await read()).toEqual([]);
    await call('import').expect(200);
    expect(await read()).toHaveLength(3);
    expect(await repository.list([source + '_autre'])).toMatchObject([
      { codeExterne: 'A', identifiantReferentiel: identifiers[1], version },
    ]);
    const before = await read();
    expect(
      before.filter(({ identifiantReferentiel }) => identifiantReferentiel)
    ).toEqual([
      expect.objectContaining({
        unite: sampleImportIndicateurDefinition.unite,
        periodicite: sampleImportIndicateurDefinition.periodicite,
      }),
      expect.objectContaining({
        unite: sampleImportIndicateurDefinition.unite,
        periodicite: sampleImportIndicateurDefinition.periodicite,
      }),
    ]);
    expect(before).toContainEqual(
      expect.objectContaining({
        codeExterne: 'a-completer',
        identifiantReferentiel: null,
        unite: null,
        periodicite: null,
        lienSource,
        version,
      })
    );
    const validReferences = references;
    for (const invalid of [
      [...validReferences, validReferences[0]],
      [{ ...validReferences[0], lienSource: '' }],
      [{ ...validReferences[0], lienSource: 'not-a-url' }],
      [
        {
          ...validReferences[0],
          lienSource: 'http://grist.numerique.gouv.fr/test-catalogue',
        },
      ],
      [
        {
          ...validReferences[0],
          lienSource: 'https://grist.numerique.gouv.fr/api/docs/test-catalogue',
        },
      ],
      [
        validReferences[0],
        {
          ...validReferences[1],
          lienSource: 'https://grist.numerique.gouv.fr/another-catalogue',
        },
      ],
      [
        {
          source,
          lienSource,
          codeExterne: 'A',
          identifiantReferentiel: 'inconnu',
        },
      ],
      [validReferences[0], { source, lienSource, codeExterne: 'A' }],
      [
        {
          source: '',
          lienSource,
          codeExterne: 'A',
          identifiantReferentiel: identifiers[0],
        },
      ],
      [
        {
          source,
          lienSource,
          codeExterne: '',
          identifiantReferentiel: identifiers[0],
        },
      ],
    ]) {
      references = invalid;
      await call('verify').expect(400);
      await call('import').expect(400);
      expect(await read()).toEqual(before);
    }
    references = validReferences;
    for (const invalidHeader of [
      ['source', 'codeExterne'],
      [...indicateurReferencesSheet.headers, 'source'],
    ]) {
      header = invalidHeader;
      await call('import').expect(400);
      expect(await read()).toEqual(before);
    }
    header = [...indicateurReferencesSheet.headers];
    referencesUnavailable = true;
    await call('import').expect(500);
    expect(await read()).toEqual(before);
    referencesUnavailable = false;
    // Omettre une référence retire son lien, sans toucher aux indicateurs hors de cet import.
    importedIdentifiers = [identifiers[0]];
    references = [{ source, lienSource, codeExterne: 'A' }];
    version = '999.0.1';
    await call('import').expect(200);
    expect(await read()).toMatchObject([
      { codeExterne: 'A', identifiantReferentiel: null, lienSource, version },
    ]);
    expect(await repository.list([source + '_autre'])).toMatchObject([
      { identifiantReferentiel: identifiers[1], version: '999.0.0' },
    ]);
    // L'unicité est aussi garantie en base, indépendamment du parseur Sheets.
    const [definition] = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(
        eq(indicateurDefinitionTable.identifiantReferentiel, identifiers[1])
      );
    await expect(
      databaseService.db.insert(indicateurReferenceExterneTable).values({
        source: source + '_autre',
        lienSource,
        codeExterne: 'A',
        indicateurId: definition.id,
        version,
      })
    ).rejects.toThrow();

    // Un import partiel ne peut pas laisser deux documents pour une même source.
    importedIdentifiers = identifiers;
    references = [
      validReferences[0],
      { ...validReferences[2], source, codeExterne: 'B' },
    ];
    await call('import').expect(200);
    const complete = await read();
    const newDocument = 'https://grist.numerique.gouv.fr/replacement';
    importedIdentifiers = [identifiers[0]];
    references = [{ ...validReferences[0], lienSource: newDocument }];
    version = '999.0.2';
    await call('import').expect(400);
    expect(await read()).toEqual(complete);
    const [unchangedDefinition] = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(
        eq(indicateurDefinitionTable.identifiantReferentiel, identifiers[0])
      );
    expect(unchangedDefinition.version).toBe('999.0.1');

    importedIdentifiers = identifiers;
    references = [
      { ...validReferences[0], lienSource: newDocument + '/Catalogue/p/1' },
      {
        ...validReferences[2],
        source,
        codeExterne: 'B',
        lienSource:
          'https://grist.numerique.gouv.fr/o/test/replacement/Catalogue/p/2',
      },
      { source, codeExterne: 'en-attente', lienSource: newDocument },
    ];
    await call('import').expect(200);
    expect(await read()).toHaveLength(3);
    references = [];
    await call('import').expect(200);
    expect(await read()).toEqual([]);
  });
});
