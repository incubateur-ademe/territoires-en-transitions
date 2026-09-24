import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { desc, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { AnalysisRunTableRepository } from '../analysis-run-table.repository';
import { analysisRunTable } from '../models/analysis-run.table';

describe('AnalysisRunRepository contract', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: AnalysisRunTableRepository;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    repository = new AnalysisRunTableRepository(db);

    return async () => {
      await app.close();
    };
  });

  const clearRuns = async (): Promise<void> => {
    await db.db.delete(analysisRunTable);
  };

  const startFromNoRun = async (): Promise<void> => {
    await clearRuns();
    onTestFinished(clearRuns);
  };

  const readDatabaseNow = async (): Promise<Date> => {
    const { rows } = await db.db.execute<{ now: string }>(
      sql`select clock_timestamp()::text as now`
    );
    return new Date(rows[0]?.now ?? Number.NaN);
  };

  it("getLastCompletedRunStart renvoie null tant qu'aucun passage n'est enregistré", async () => {
    await startFromNoRun();

    expect(await repository.getLastCompletedRunStart()).toEqual({
      success: true,
      data: null,
    });
  });

  it('getLastCompletedRunStart renvoie la date de début du dernier passage terminé', async () => {
    await startFromNoRun();

    await repository.createCompletedRun({
      startedAt: new Date('2026-09-22T02:00:00.000Z'),
    });
    await repository.createCompletedRun({
      startedAt: new Date('2026-09-23T02:00:00.000Z'),
    });

    expect(await repository.getLastCompletedRunStart()).toEqual({
      success: true,
      data: new Date('2026-09-23T02:00:00.000Z'),
    });
  });

  it("createCompletedRun enregistre la date de début donnée et la date de fin à l'heure de la base", async () => {
    await startFromNoRun();

    const beforeCreate = await readDatabaseNow();

    const createRunResult = await repository.createCompletedRun({
      startedAt: new Date('2026-09-24T02:00:00.000Z'),
    });

    const afterCreate = await readDatabaseNow();
    const [run] = await db.db
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
