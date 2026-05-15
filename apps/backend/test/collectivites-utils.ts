import { ImportCollectiviteRelationsResponse } from '@tet/backend/collectivites/import-collectivite-relations/import-collectivite-relations.response';
import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { count, eq } from 'drizzle-orm';

/** Advisory lock id for coordinating relation imports across parallel vitest workers. */
const COLLECTIVITE_RELATIONS_IMPORT_LOCK_ID = 2_422_003;

/**
 * EPCI–commune imports alone create tens of thousands of rows; below this threshold
 * the table is considered empty for test purposes.
 */
const MIN_COLLECTIVITE_RELATIONS_FOR_TESTS = 5_000;

export type CollectiviteRelationsImporter = {
  importEpciCommunesRelations: () => Promise<ImportCollectiviteRelationsResponse>;
  importSyndicatEpciRelations: () => Promise<ImportCollectiviteRelationsResponse>;
};

let ensureRelationsPromise: Promise<void> | null = null;

async function countCollectiviteRelations(
  database: DatabaseService
): Promise<number> {
  const [row] = await database.db
    .select({ count: count() })
    .from(collectiviteRelationsTable);
  return Number(row?.count ?? 0);
}

export type ImportCollectiviteRelationsResults = {
  epci: ImportCollectiviteRelationsResponse;
  syndicat: ImportCollectiviteRelationsResponse;
};

async function runCollectiviteRelationsImport(
  importRelations: CollectiviteRelationsImporter
): Promise<ImportCollectiviteRelationsResults> {
  const epci = await importRelations.importEpciCommunesRelations();
  const syndicat = await importRelations.importSyndicatEpciRelations();
  return { epci, syndicat };
}

async function withCollectiviteRelationsImportLock<T>(
  database: DatabaseService,
  fn: () => Promise<T>
): Promise<T> {
  const client = await database.db.$client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [
      COLLECTIVITE_RELATIONS_IMPORT_LOCK_ID,
    ]);
    return await fn();
  } finally {
    await client
      .query('SELECT pg_advisory_unlock($1)', [
        COLLECTIVITE_RELATIONS_IMPORT_LOCK_ID,
      ])
      .catch(() => undefined);
    client.release();
  }
}

/**
 * Runs EPCI–commune and syndicat–EPCI imports while holding a session-level advisory
 * lock so parallel test files do not bulk-insert at the same time.
 */
export async function importCollectiviteRelationsUnderLock(
  database: DatabaseService,
  importRelations: CollectiviteRelationsImporter
): Promise<ImportCollectiviteRelationsResults> {
  return withCollectiviteRelationsImportLock(database, () =>
    runCollectiviteRelationsImport(importRelations)
  );
}

/**
 * Ensures collectivite relations exist for tests that consume them (e.g. list with
 * `withRelations`). Skips the heavy CSV import when the table is already populated;
 * coordinates concurrent workers via an advisory lock (count checked under lock).
 */
export async function ensureCollectiviteRelationsImported(
  database: DatabaseService,
  importRelations: CollectiviteRelationsImporter
): Promise<void> {
  if (!ensureRelationsPromise) {
    ensureRelationsPromise = withCollectiviteRelationsImportLock(
      database,
      async () => {
        if (
          (await countCollectiviteRelations(database)) >=
          MIN_COLLECTIVITE_RELATIONS_FOR_TESTS
        ) {
          return;
        }
        await runCollectiviteRelationsImport(importRelations);
      }
    );
  }
  return ensureRelationsPromise;
}

export const getCollectiviteIdBySiren = async (
  databaseService: DatabaseService,
  siren: string
): Promise<number> => {
  const result = await databaseService.db
    .select({
      id: collectiviteTable.id,
    })
    .from(collectiviteTable)
    .where(eq(collectiviteTable.siren, siren));
  if (result.length === 0) {
    throw new Error(`Epci with siren ${siren} not found`);
  }
  return result[0].id;
};
