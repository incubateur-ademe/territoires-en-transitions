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
import { failure } from '@tet/backend/utils/result.type';
import { randomUUID } from 'crypto';
import { eq, inArray } from 'drizzle-orm';
import { default as request } from 'supertest';
import * as z from 'zod/mini';
import { indicateurCategorieTagTable } from '../definitions/indicateur-categorie-tag.table';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import TrajectoiresXlsxService from '../trajectoires/trajectoires-xlsx.service';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';
import { ReconcileIndicateurValeursService } from '../valeurs/reconcile-indicateur-valeurs/reconcile-indicateur-valeurs.service';
import { sampleImportIndicateurDefinition } from './samples/import-indicateur-definition.sample';

// Runs after database seeding: disposable collectivités must not consume IDs
// before the seed scripts create the collectivités referenced by their fixtures.
describe('import-indicateur-definition atomicity', () => {
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

  it('importe les catégories publiques et annule catalogue et recalculs ensemble en cas d’échec', async () => {
    const collectivites = [
      await addTestCollectivite(databaseService),
      await addTestCollectivite(databaseService),
    ];
    const prefix = `catalogue_${randomUUID().replaceAll('-', '')}`;
    const categoryName = `${prefix}_categorie`;
    const identifiants = [`${prefix}_source`, `${prefix}_calcul`];
    let version = '999.0.0';
    let factor: number | null = 2;
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

    // Only the external spreadsheet is substituted. Import, relations, SQL and
    // recalculation use the application providers and the real database.
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
        if (range?.startsWith('Objectifs')) return { data: [], header: null };
        if (range?.startsWith('Indicateur')) {
          return {
            data: identifiants.map((identifiantReferentiel, index) =>
              z.parse(schema, {
                ...sampleImportIndicateurDefinition,
                ...templateData,
                identifiantReferentiel,
                titre: identifiantReferentiel,
                categories: [categoryName],
                thematiques: [],
                parents: null,
                valeurCalcule:
                  index === 0 || factor === null
                    ? null
                    : `val(${identifiants[0]}) * ${factor}`,
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

    const token = signTestAuthToken(
      { role: AuthRole.SERVICE_ROLE },
      app.get(ConfigurationService).get('SUPABASE_JWT_SECRET')
    );
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valeurs: collectivites.map(({ collectivite }, index) => ({
          collectiviteId: collectivite.id,
          indicateurId: source.id,
          dateValeur: '2025-01-01',
          resultat: index + 1,
        })),
      })
      .expect(201);
    const readValeurs = () =>
      databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(
          inArray(indicateurValeurTable.indicateurId, [source.id, target.id])
        )
        .orderBy(indicateurValeurTable.id);
    const before = await readValeurs();
    expect(
      before.filter(({ indicateurId }) => indicateurId === target.id)
    ).toHaveLength(2);

    version = '999.0.1';
    factor = 3;
    const reconciliation = app.get(ReconcileIndicateurValeursService);
    const recompute = reconciliation.recomputeAll.bind(reconciliation);
    let recalculatedCollectiviteIds: number[] = [];
    const failureAfterRecompute = vi
      .spyOn(reconciliation, 'recomputeAll')
      .mockImplementation(async (...args) => {
        const result = await recompute(...args);
        if (!result.success) return result;
        recalculatedCollectiviteIds = result.data.map(
          ({ collectiviteId }) => collectiviteId
        );
        return failure(
          'DATABASE_ERROR',
          new Error('Injected failure after real recalculation')
        );
      });
    onTestFinished(() => failureAfterRecompute.mockRestore());
    await importCatalogue().expect(500);
    failureAfterRecompute.mockRestore();
    expect(
      recalculatedCollectiviteIds.sort((left, right) => left - right)
    ).toEqual(
      collectivites
        .map(({ collectivite }) => collectivite.id)
        .sort((left, right) => left - right)
    );

    expect(await readValeurs()).toEqual(before);
    expect(
      await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(inArray(indicateurDefinitionTable.id, [source.id, target.id]))
        .orderBy(indicateurDefinitionTable.id)
    ).toEqual([...definitions].sort((left, right) => left.id - right.id));

    // The rolled-back catalogue version remains importable and updates both collectivités.
    await importCatalogue().expect(200);
    const after = await readValeurs();
    for (const [index, { collectivite }] of collectivites.entries()) {
      expect(
        after.find(
          (valeur) =>
            valeur.indicateurId === target.id &&
            valeur.collectiviteId === collectivite.id
        )
      ).toMatchObject({
        resultat: (index + 1) * factor,
        periodicite: 'annuelle',
        calculAuto: true,
      });
    }

    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valeurs: [
          {
            collectiviteId: collectivites[1].collectivite.id,
            indicateurId: target.id,
            dateValeur: '2025-01-01',
            resultat: 99,
            calculAuto: false,
          },
        ],
      })
      .expect(201);
    // Removing a formula removes obsolete automatic results, while manual edits survive.
    version = '999.0.2';
    factor = null;
    await importCatalogue().expect(200);
    expect(
      (await readValeurs()).filter(
        ({ indicateurId }) => indicateurId === target.id
      )
    ).toMatchObject([
      {
        collectiviteId: collectivites[1].collectivite.id,
        resultat: 99,
        calculAuto: false,
      },
    ]);
  });
});
