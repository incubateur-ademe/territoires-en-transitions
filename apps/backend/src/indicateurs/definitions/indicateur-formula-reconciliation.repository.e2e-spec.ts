import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { onTestFinished } from 'vitest';
import type { ImportIndicateurDefinitionType } from '../import-indicateurs/import-indicateur-definition.dto';
import ImportIndicateurDefinitionService from '../import-indicateurs/import-indicateur-definition.service';
import { importObjectifSchema } from '../import-indicateurs/import-indicateur-objectif.dto';
import { indicateurObjectifTable } from '../shared/models/indicateur-objectif.table';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';
import { indicateurDefinitionTable } from './indicateur-definition.table';
import { IndicateurFormulaReconciliationRepository } from './indicateur-formula-reconciliation.repository';
import { IndicateurFormulaReconciliationService } from './indicateur-formula-reconciliation.service';
import { indicateurFormulaReconciliationTable } from './indicateur-formula-reconciliation.table';

type Deferred<T> = Readonly<{
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}>;

function deferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve'];
  let reject!: Deferred<T>['reject'];
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('IndicateurFormulaReconciliation (database)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let repository: IndicateurFormulaReconciliationRepository;
  let service: IndicateurFormulaReconciliationService;
  let crudValeursService: CrudValeursService;
  let importIndicateurDefinitionService: ImportIndicateurDefinitionService;
  let collectiviteIds: number[];
  let cleanupCollectivites = async () => undefined;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    repository = app.get(IndicateurFormulaReconciliationRepository);
    service = app.get(IndicateurFormulaReconciliationService);
    crudValeursService = app.get(CrudValeursService);
    importIndicateurDefinitionService = app.get(
      ImportIndicateurDefinitionService
    );

    const fixtures: Awaited<ReturnType<typeof addTestCollectivite>>[] = [];
    cleanupCollectivites = async () => {
      for (const fixture of fixtures.reverse()) {
        await fixture.cleanup();
      }
    };
    for (let index = 0; index < 4; index++) {
      fixtures.push(await addTestCollectivite(databaseService));
    }
    collectiviteIds = fixtures.map(({ collectivite }) => collectivite.id);
  });

  afterAll(async () => {
    await cleanupCollectivites();
    await app.close();
  });

  async function insertPlatformDefinitions(suffix: string) {
    const sourceIdentifiant = `test_reconciliation_${suffix}_source`;
    const unrelatedIdentifiant = `test_reconciliation_${suffix}_unrelated`;
    const targetIdentifiant = `test_reconciliation_${suffix}_target`;
    const formula = `val(${sourceIdentifiant})`;
    const definitions = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values([
        {
          identifiantReferentiel: sourceIdentifiant,
          titre: 'Source de réconciliation',
          unite: 'MWh',
          periodicite: 'annuelle',
        },
        {
          identifiantReferentiel: unrelatedIdentifiant,
          titre: 'Source étrangère à la réconciliation',
          unite: 'MWh',
          periodicite: 'annuelle',
        },
        {
          identifiantReferentiel: targetIdentifiant,
          titre: 'Cible calculée de réconciliation',
          unite: 'MWh',
          periodicite: 'annuelle',
          valeurCalcule: formula,
          sansValeurUtilisateur: true,
        },
      ])
      .returning();
    const [source, unrelated, target] = definitions;

    onTestFinished(async () => {
      await databaseService.db.delete(indicateurDefinitionTable).where(
        inArray(
          indicateurDefinitionTable.id,
          definitions.map(({ id }) => id)
        )
      );
    });

    return {
      source,
      unrelated,
      target,
      sourceIdentifiant,
      targetIdentifiant,
      formula,
    };
  }

  function importedDefinition(
    identifiantReferentiel: string,
    valeurCalcule: string | null,
    parents: string[] | null = null
  ): ImportIndicateurDefinitionType {
    return {
      identifiantReferentiel,
      titre: `Import ${identifiantReferentiel}`,
      titreLong: null,
      titreCourt: null,
      description: null,
      unite: 'MWh',
      periodicite: 'annuelle',
      precision: 2,
      borneMin: null,
      borneMax: null,
      participationScore: false,
      sansValeurUtilisateur: valeurCalcule !== null,
      valeurCalcule,
      exprCible: null,
      exprSeuil: null,
      libelleCibleSeuil: null,
      version: '1.0.0',
      parents,
      categories: ['cae'],
      thematiques: ['energie_et_climat'],
    };
  }

  test('enqueues the union of source owners and stale automatic target owners without duplicates', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const { source, unrelated, target, sourceIdentifiant, formula } =
      await insertPlatformDefinitions(suffix);
    const [sourceOnlyId, sourceAndStaleId, staleOnlyId, unrelatedOnlyId] =
      collectiviteIds;

    await databaseService.db.insert(indicateurValeurTable).values([
      {
        indicateurId: source.id,
        collectiviteId: sourceOnlyId,
        dateValeur: '2025-01-01',
        resultat: 1,
      },
      {
        indicateurId: source.id,
        collectiviteId: sourceAndStaleId,
        dateValeur: '2025-01-01',
        resultat: 2,
      },
      {
        indicateurId: target.id,
        collectiviteId: sourceAndStaleId,
        dateValeur: '2024-01-01',
        resultat: 3,
        calculAuto: true,
      },
      {
        indicateurId: target.id,
        collectiviteId: staleOnlyId,
        dateValeur: '2024-01-01',
        resultat: 4,
        calculAuto: true,
      },
      {
        indicateurId: unrelated.id,
        collectiviteId: unrelatedOnlyId,
        dateValeur: '2025-01-01',
        resultat: 5,
      },
      {
        indicateurId: target.id,
        collectiviteId: unrelatedOnlyId,
        dateValeur: '2024-01-01',
        resultat: 6,
        calculAuto: false,
      },
    ]);

    const enqueued = await databaseService.db.transaction((tx) =>
      repository.enqueueForDefinition(
        {
          indicateurId: target.id,
          expectedFormula: formula,
          sourceIdentifiants: [sourceIdentifiant],
        },
        tx
      )
    );

    const workItems = await databaseService.db
      .select()
      .from(indicateurFormulaReconciliationTable)
      .where(eq(indicateurFormulaReconciliationTable.indicateurId, target.id))
      .orderBy(asc(indicateurFormulaReconciliationTable.collectiviteId));

    expect(enqueued.workItemsCount).toBe(3);
    expect(workItems).toHaveLength(3);
    expect(workItems.map(({ collectiviteId }) => collectiviteId)).toEqual(
      [sourceOnlyId, sourceAndStaleId, staleOnlyId].sort(
        (left, right) => left - right
      )
    );
    expect(new Set(workItems.map(({ generation }) => generation))).toEqual(
      new Set([enqueued.generation])
    );
    expect(
      workItems.every(({ expectedFormula }) => expectedFormula === formula)
    ).toBe(true);
  });

  test('rolls the formula mutation back when durable enqueue fails', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const { source, target, sourceIdentifiant, targetIdentifiant, formula } =
      await insertPlatformDefinitions(suffix);
    await databaseService.db.insert(indicateurValeurTable).values({
      indicateurId: source.id,
      collectiviteId: collectiviteIds[0],
      dateValeur: '2025-01-01',
      resultat: 10,
    });
    const nextFormula = `${formula} + 1`;
    const enqueueSpy = vi
      .spyOn(repository, 'enqueueForDefinition')
      .mockRejectedValueOnce(new Error('forced durable enqueue failure'));

    try {
      await expect(
        importIndicateurDefinitionService.upsertIndicateurDefinitions([
          importedDefinition(sourceIdentifiant, null),
          importedDefinition(targetIdentifiant, nextFormula, [
            sourceIdentifiant,
          ]),
        ])
      ).rejects.toThrow('forced durable enqueue failure');
    } finally {
      enqueueSpy.mockRestore();
    }

    const [persistedDefinition] = await databaseService.db
      .select({ valeurCalcule: indicateurDefinitionTable.valeurCalcule })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, target.id));
    const pending = await repository.countPending([target.id]);

    expect(persistedDefinition.valeurCalcule).toBe(formula);
    expect(pending).toBe(0);
  });

  test('rolls the formula and its queued intentions back when objective persistence fails', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const { source, target, sourceIdentifiant, targetIdentifiant, formula } =
      await insertPlatformDefinitions(suffix);
    await databaseService.db.insert(indicateurValeurTable).values({
      indicateurId: source.id,
      collectiviteId: collectiviteIds[0],
      dateValeur: '2025-01-01',
      resultat: 10,
    });
    const nextFormula = `${formula} + 1`;
    const objectif = importObjectifSchema.parse({
      identifiantReferentiel: targetIdentifiant,
      dateValeur: '2030-12-31',
      formule: '42',
    });
    const originalEnqueue = repository.enqueueForDefinition.bind(repository);
    let enqueuedGeneration: string | undefined;
    let enqueuedWorkItemsCount: number | undefined;
    const enqueueSpy = vi
      .spyOn(repository, 'enqueueForDefinition')
      .mockImplementation(async (input, tx) => {
        const result = await originalEnqueue(input, tx);
        enqueuedGeneration = result.generation;
        enqueuedWorkItemsCount = result.workItemsCount;
        return result;
      });

    try {
      await expect(
        importIndicateurDefinitionService.upsertIndicateurDefinitions(
          [
            importedDefinition(sourceIdentifiant, null),
            importedDefinition(targetIdentifiant, nextFormula, [
              sourceIdentifiant,
            ]),
          ],
          // Chaque ligne est valide, mais leur même clé dans un unique INSERT
          // fait échouer PostgreSQL avec le cardinality violation de l'UPSERT.
          [objectif, { ...objectif }]
        )
      ).rejects.toThrow(/Error upserting indicateur objectifs/);
    } finally {
      enqueueSpy.mockRestore();
    }

    const [persistedDefinition] = await databaseService.db
      .select({ valeurCalcule: indicateurDefinitionTable.valeurCalcule })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, target.id));
    const pendingWorkItems = await databaseService.db
      .select()
      .from(indicateurFormulaReconciliationTable)
      .where(eq(indicateurFormulaReconciliationTable.indicateurId, target.id));
    const persistedObjectifs = await databaseService.db
      .select()
      .from(indicateurObjectifTable)
      .where(eq(indicateurObjectifTable.indicateurId, target.id));

    // L'intention a réellement été insérée avant l'échec tardif, puis le
    // rollback de l'unique transaction l'a retirée avec la nouvelle formule.
    expect(enqueuedGeneration).toEqual(expect.any(String));
    expect(enqueuedWorkItemsCount).toBe(1);
    expect(persistedDefinition.valeurCalcule).toBe(formula);
    expect(pendingWorkItems).toEqual([]);
    expect(persistedObjectifs).toEqual([]);
  });

  test('rolls value writes back and retains the work item when computation fails', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const { source, target, formula } = await insertPlatformDefinitions(suffix);
    const [sourceValue] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: source.id,
        collectiviteId: collectiviteIds[0],
        dateValeur: '2025-01-01',
        resultat: 12,
      })
      .returning();
    const generation = randomUUID();
    const [workItem] = await databaseService.db
      .insert(indicateurFormulaReconciliationTable)
      .values({
        generation,
        indicateurId: target.id,
        collectiviteId: collectiviteIds[0],
        expectedFormula: formula,
      })
      .returning();

    const reconciliationSpy = vi
      .spyOn(
        crudValeursService,
        'reconcileCollectiviteCalculatedIndicateurValeurs'
      )
      .mockImplementation(async (_collectiviteId, _definitions, tx) => {
        await tx
          .update(indicateurValeurTable)
          .set({ resultat: 999 })
          .where(eq(indicateurValeurTable.id, sourceValue.id));
        throw new Error('forced computation failure');
      });

    const result = await service
      .drain({
        limit: 1,
        indicateurIds: [target.id],
        includeDeferred: true,
      })
      .finally(() => reconciliationSpy.mockRestore());

    const [persistedValue] = await databaseService.db
      .select({ resultat: indicateurValeurTable.resultat })
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.id, sourceValue.id));
    const [persistedWorkItem] = await databaseService.db
      .select()
      .from(indicateurFormulaReconciliationTable)
      .where(
        and(
          eq(indicateurFormulaReconciliationTable.id, workItem.id),
          eq(indicateurFormulaReconciliationTable.generation, generation)
        )
      );

    expect(result).toMatchObject({
      processedCount: 0,
      failedCount: 1,
      remainingCount: 1,
      complete: false,
    });
    expect(persistedValue.resultat).toBe(12);
    expect(persistedWorkItem).toMatchObject({
      id: workItem.id,
      generation,
      failureCount: 1,
      lastError: 'forced computation failure',
    });
    expect(persistedWorkItem.lastFailedAt).not.toBeNull();
    expect(Date.parse(persistedWorkItem.nextAttemptAt)).toBeGreaterThan(
      Date.parse(persistedWorkItem.createdAt)
    );
  });

  test('concurrent claims skip a locked row and complete each work item exactly once', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const { target, formula } = await insertPlatformDefinitions(suffix);
    await databaseService.db
      .insert(indicateurFormulaReconciliationTable)
      .values(
        collectiviteIds.slice(0, 2).map((collectiviteId) => ({
          generation: randomUUID(),
          indicateurId: target.id,
          collectiviteId,
          expectedFormula: formula,
        }))
      );

    const firstClaimed = deferred<string>();
    const releaseFirst = deferred<void>();
    const firstTransaction = databaseService.db
      .transaction(async (tx) => {
        const workItem = await repository.claimNext(tx, {
          indicateurIds: [target.id],
          includeDeferred: true,
        });
        if (!workItem) throw new Error('Expected the first work item');
        firstClaimed.resolve(workItem.id);
        await releaseFirst.promise;
        await repository.complete(workItem.id, tx);
        return workItem.id;
      })
      .catch((error: unknown) => {
        firstClaimed.reject(error);
        throw error;
      });

    const firstId = await firstClaimed.promise;
    let secondId: string;
    try {
      secondId = await databaseService.db.transaction(async (tx) => {
        const workItem = await repository.claimNext(tx, {
          indicateurIds: [target.id],
          includeDeferred: true,
        });
        if (!workItem) throw new Error('Expected an unlocked work item');
        await repository.complete(workItem.id, tx);
        return workItem.id;
      });
    } finally {
      releaseFirst.resolve();
      await firstTransaction;
    }

    expect(secondId).not.toBe(firstId);
    expect(await repository.countPending([target.id])).toBe(0);
  });
});
