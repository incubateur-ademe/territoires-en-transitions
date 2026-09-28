import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { desc, eq, sql } from 'drizzle-orm';
import { TransactionRollbackError } from 'drizzle-orm/errors';
import { beforeAll, describe, expect, it } from 'vitest';
import { AnalysisRunTableRepository } from '../analysis-run-table.repository';
import { analysisRunTable } from '../models/analysis-run.table';

type RepositoryInRolledBackTransaction = {
  readonly repository: AnalysisRunTableRepository;
  readonly tx: Transaction;
};

describe('AnalysisRunRepository contract', () => {
  let app: INestApplication;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  const checkFromNoRunThenRollback = async (
    check: (
      repositoryInTransaction: RepositoryInRolledBackTransaction
    ) => Promise<void>
  ): Promise<void> => {
    try {
      await db.db.transaction(
        async (tx) => {
          await tx.delete(analysisRunTable);
          await check({
            repository: new AnalysisRunTableRepository({
              db: tx,
            } as unknown as DatabaseService),
            tx,
          });
          tx.rollback();
        },
        { isolationLevel: 'repeatable read' }
      );
    } catch (error) {
      if (!(error instanceof TransactionRollbackError)) {
        throw error;
      }
    }
  };

  const readDatabaseNow = async (
    runner: DatabaseService['db'] | Transaction
  ): Promise<Date> => {
    const { rows } = await runner.execute<{ now: string }>(
      sql`select clock_timestamp()::text as now`
    );
    return new Date(rows[0]?.now ?? Number.NaN);
  };

  const readRunsStartedAt = async (
    runner: DatabaseService['db'] | Transaction,
    startedAt: Date
  ): Promise<Date[]> => {
    const runs = await runner
      .select({ startedAt: analysisRunTable.startedAt })
      .from(analysisRunTable)
      .where(eq(analysisRunTable.startedAt, startedAt));
    return runs.map((run) => run.startedAt);
  };

  it("createCompletedRun écrit dans la transaction de l'appelant et n'enregistre rien si elle est annulée", async () => {
    const repository = new AnalysisRunTableRepository(db);
    const startedAt = new Date('2001-01-01T02:00:00.000Z');

    await checkFromNoRunThenRollback(async ({ tx }) => {
      const createRunResult = await repository.createCompletedRun({
        startedAt,
        tx,
      });

      expect({
        createRunResult,
        runsInTransaction: await readRunsStartedAt(tx, startedAt),
      }).toEqual({
        createRunResult: { success: true, data: undefined },
        runsInTransaction: [startedAt],
      });
    });

    expect(await readRunsStartedAt(db.db, startedAt)).toEqual([]);
  });

  it("getLastCompletedRunStart renvoie null tant qu'aucun passage n'est enregistré", async () => {
    await checkFromNoRunThenRollback(async ({ repository }) => {
      expect(await repository.getLastCompletedRunStart()).toEqual({
        success: true,
        data: null,
      });
    });
  });

  it('getLastCompletedRunStart renvoie la date de début du dernier passage terminé', async () => {
    await checkFromNoRunThenRollback(async ({ repository, tx }) => {
      await tx.insert(analysisRunTable).values({
        startedAt: new Date('2026-09-22T02:00:00.000Z'),
        finishedAt: new Date('2026-09-23T05:00:00.000Z'),
      });
      await tx.insert(analysisRunTable).values({
        startedAt: new Date('2026-09-23T02:00:00.000Z'),
        finishedAt: new Date('2026-09-23T04:00:00.000Z'),
      });

      expect(await repository.getLastCompletedRunStart()).toEqual({
        success: true,
        data: new Date('2026-09-22T02:00:00.000Z'),
      });
    });
  });

  it('getLastCompletedRunStart renvoie la date de début du passage enregistré en dernier quand deux passages ont la même date de fin', async () => {
    await checkFromNoRunThenRollback(async ({ repository, tx }) => {
      await repository.createCompletedRun({
        startedAt: new Date('2026-09-23T02:00:00.000Z'),
      });
      await repository.createCompletedRun({
        startedAt: new Date('2026-09-22T02:00:00.000Z'),
      });

      const finishedAts = await tx
        .selectDistinct({ finishedAt: analysisRunTable.finishedAt })
        .from(analysisRunTable);
      expect({
        distinctFinishedAtCount: finishedAts.length,
        lastRunStart: await repository.getLastCompletedRunStart(),
      }).toEqual({
        distinctFinishedAtCount: 1,
        lastRunStart: {
          success: true,
          data: new Date('2026-09-22T02:00:00.000Z'),
        },
      });
    });
  });

  it("createCompletedRun enregistre la date de début donnée et la date de fin à l'heure de la base", async () => {
    const beforeCreate = await readDatabaseNow(db.db);

    await checkFromNoRunThenRollback(async ({ repository, tx }) => {
      const createRunResult = await repository.createCompletedRun({
        startedAt: new Date('2026-09-24T02:00:00.000Z'),
      });

      const afterCreate = await readDatabaseNow(tx);
      const [run] = await tx
        .select({
          startedAt: analysisRunTable.startedAt,
          finishedAt: analysisRunTable.finishedAt,
        })
        .from(analysisRunTable)
        .orderBy(desc(analysisRunTable.id))
        .limit(1);
      expect({
        createRunResult,
        startedAt: run?.startedAt,
        finishedAtWithinCreate:
          run !== undefined &&
          run.finishedAt >= beforeCreate &&
          run.finishedAt <= afterCreate,
      }).toEqual({
        createRunResult: { success: true, data: undefined },
        startedAt: new Date('2026-09-24T02:00:00.000Z'),
        finishedAtWithinCreate: true,
      });
    });
  });
});
