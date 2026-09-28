import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type Result } from '@tet/backend/utils/result.type';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray, sql } from 'drizzle-orm';
import { TransactionRollbackError } from 'drizzle-orm/errors';
import { sortBy } from 'es-toolkit';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { z } from 'zod';
import { FicheActionAnalysisRepository } from '../fiche-action-analysis.repository';
import { ficheActionAnalysisTable } from '../models/fiche-action-analysis.table';
import { FicheAnalysis } from '../models/fiche-analysis';
import { FicheAnalysisStatusError } from './analyze-fiches.errors';
import {
  FicheAnalysisUpsert,
  ficheAnalysisUpsertSchema,
} from './fiche-analysis-status.repository';

const firstFingerprint = 'a'.repeat(64);
const secondFingerprint = 'b'.repeat(64);

type StoredAnalysis = Pick<
  typeof ficheActionAnalysisTable.$inferSelect,
  'ficheId' | 'status' | 'fingerprint' | 'retryCount'
>;

type UpsertedAnalysis = z.input<typeof ficheAnalysisUpsertSchema>;

type FicheAnalysisCaller = ReturnType<TrpcRouter['createCaller']>;

type NeighborCollectiviteWithFiche = {
  readonly collectiviteId: number;
  readonly ficheId: number;
  readonly ficheCleanup: () => Promise<void>;
};

type ListAnalysesResult = Result<FicheAnalysis[], FicheAnalysisStatusError>;

const sortAnalysesByFicheId = (
  listResult: ListAnalysesResult
): ListAnalysesResult => {
  if (!listResult.success) {
    return listResult;
  }
  return {
    ...listResult,
    data: sortBy(listResult.data, [({ ficheId }) => ficheId]),
  };
};

describe('FicheAnalysisStatusRepository contract', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: FicheActionAnalysisRepository;
  let caller: FicheAnalysisCaller;
  let collectiviteId: number;
  let ficheId: number;
  let otherFicheId: number;
  let neighborCollectiviteId: number;
  let neighborFicheId: number;

  const createNeighborCollectiviteWithFiche = async (
    router: TrpcRouter
  ): Promise<NeighborCollectiviteWithFiche> => {
    const neighbor = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const neighborFiche = await createFicheAndCleanupFunction({
      caller: router.createCaller({
        user: getAuthUserFromUserCredentials(neighbor.user),
      }),
      ficheInput: {
        collectiviteId: neighbor.collectivite.id,
        titre: 'Fiche de la collectivité voisine',
      },
    });
    return { collectiviteId: neighbor.collectivite.id, ...neighborFiche };
  };

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    const router: TrpcRouter = await getTestRouter(app);
    repository = new FicheActionAnalysisRepository(db);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    collectiviteId = collectivite.id;
    caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const [fiche, otherFiche, neighborFiche] = await Promise.all([
      createFicheAndCleanupFunction({
        caller,
        ficheInput: { collectiviteId, titre: 'Aménager des pistes cyclables' },
      }),
      createFicheAndCleanupFunction({
        caller,
        ficheInput: { collectiviteId, titre: 'Développer le covoiturage' },
      }),
      createNeighborCollectiviteWithFiche(router),
    ]);
    ficheId = fiche.ficheId;
    otherFicheId = otherFiche.ficheId;
    neighborCollectiviteId = neighborFiche.collectiviteId;
    neighborFicheId = neighborFiche.ficheId;

    return async () => {
      await Promise.all(
        [fiche, otherFiche, neighborFiche].map(({ ficheCleanup }) =>
          ficheCleanup()
        )
      );
      await app.close();
    };
  });

  const trackedFicheIds = (): number[] => [
    ficheId,
    otherFicheId,
    neighborFicheId,
  ];

  const toUpsert = (analysis: UpsertedAnalysis): FicheAnalysisUpsert =>
    ficheAnalysisUpsertSchema.parse(analysis);

  const upsert = async (...analyses: UpsertedAnalysis[]): Promise<void> => {
    const upsertResult = await repository.upsertAnalyses({
      analyses: analyses.map(toUpsert),
    });
    expect(upsertResult).toEqual({ success: true, data: undefined });
  };

  const readStored = async (
    ficheIds: number[] = trackedFicheIds(),
    runner: DatabaseService['db'] | Transaction = db.db
  ): Promise<StoredAnalysis[]> =>
    runner
      .select({
        ficheId: ficheActionAnalysisTable.ficheId,
        status: ficheActionAnalysisTable.status,
        fingerprint: ficheActionAnalysisTable.fingerprint,
        retryCount: ficheActionAnalysisTable.retryCount,
      })
      .from(ficheActionAnalysisTable)
      .where(inArray(ficheActionAnalysisTable.ficheId, ficheIds))
      .orderBy(ficheActionAnalysisTable.ficheId);

  const readDatabaseNow = async (): Promise<Date> => {
    const { rows } = await db.db.execute<{ now: string }>(
      sql`select clock_timestamp()::text as now`
    );
    return new Date(rows[0]?.now ?? Number.NaN);
  };

  const readAnalyzedAt = async (): Promise<Date | undefined> => {
    const [storedAnalysis] = await db.db
      .select({ analyzedAt: ficheActionAnalysisTable.analyzedAt })
      .from(ficheActionAnalysisTable)
      .where(eq(ficheActionAnalysisTable.ficheId, ficheId));
    return storedAnalysis?.analyzedAt;
  };

  const runInRolledBackTransaction = async (
    write: (tx: Transaction) => Promise<void>
  ): Promise<void> => {
    try {
      await db.db.transaction(async (tx) => {
        await write(tx);
        tx.rollback();
      });
    } catch (error) {
      if (!(error instanceof TransactionRollbackError)) {
        throw error;
      }
    }
  };

  const registerStatusCleanup = (): void => {
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionAnalysisTable)
        .where(inArray(ficheActionAnalysisTable.ficheId, trackedFicheIds()));
    });
  };

  it("upsertAnalyses d'une fiche traitée écrit le statut et l'empreinte, et remet le compteur à 0", async () => {
    registerStatusCleanup();
    await upsert({
      ficheId,
      collectiviteId,
      status: 'processed',
      fingerprint: firstFingerprint,
    });
    await upsert({ ficheId, collectiviteId, status: 'failed' });
    await upsert({ ficheId, collectiviteId, status: 'failed' });

    await upsert({
      ficheId,
      collectiviteId,
      status: 'processed',
      fingerprint: secondFingerprint,
    });

    expect(await readStored()).toEqual([
      {
        ficheId,
        status: 'processed',
        fingerprint: secondFingerprint,
        retryCount: 0,
      },
    ]);
  });

  it("upsertAnalyses dans la transaction de l'appelant n'écrit rien si elle est annulée", async () => {
    registerStatusCleanup();

    await runInRolledBackTransaction(async (tx) => {
      const upsertResult = await repository.upsertAnalyses({
        analyses: [toUpsert({ ficheId, collectiviteId, status: 'failed' })],
        tx,
      });

      expect({
        upsertResult,
        storedInTransaction: await readStored(trackedFicheIds(), tx),
      }).toEqual({
        upsertResult: { success: true, data: undefined },
        storedInTransaction: [
          { ficheId, status: 'failed', fingerprint: null, retryCount: 1 },
        ],
      });
    });

    expect(await readStored()).toEqual([]);
  });

  it("upsertAnalyses d'une fiche en erreur sans statut écrit un compteur à 1 et aucune empreinte", async () => {
    registerStatusCleanup();

    await upsert({ ficheId, collectiviteId, status: 'failed' });

    expect(await readStored()).toEqual([
      { ficheId, status: 'failed', fingerprint: null, retryCount: 1 },
    ]);
  });

  it("upsertAnalyses d'une fiche en erreur déjà analysée incrémente le compteur et garde l'empreinte", async () => {
    registerStatusCleanup();
    await upsert({
      ficheId,
      collectiviteId,
      status: 'processed',
      fingerprint: firstFingerprint,
    });
    await upsert({ ficheId, collectiviteId, status: 'failed' });

    await upsert({ ficheId, collectiviteId, status: 'failed' });

    expect(await readStored()).toEqual([
      {
        ficheId,
        status: 'failed',
        fingerprint: firstFingerprint,
        retryCount: 2,
      },
    ]);
  });

  it("upsertAnalyses d'une fiche périmée remet le compteur à 0 et garde l'empreinte", async () => {
    registerStatusCleanup();
    await upsert({
      ficheId,
      collectiviteId,
      status: 'processed',
      fingerprint: firstFingerprint,
    });
    await upsert({ ficheId, collectiviteId, status: 'failed' });

    await upsert({ ficheId, collectiviteId, status: 'stale' });

    expect(await readStored()).toEqual([
      {
        ficheId,
        status: 'stale',
        fingerprint: firstFingerprint,
        retryCount: 0,
      },
    ]);
  });

  it('upsertAnalyses sans analyse ne modifie aucun statut', async () => {
    registerStatusCleanup();
    await upsert({ ficheId, collectiviteId, status: 'failed' });

    const upsertResult = await repository.upsertAnalyses({ analyses: [] });

    expect({ upsertResult, stored: await readStored() }).toEqual({
      upsertResult: { success: true, data: undefined },
      stored: [{ ficheId, status: 'failed', fingerprint: null, retryCount: 1 }],
    });
  });

  it("upsertAnalyses d'une même fiche donnée deux fois n'écrit que sa dernière analyse", async () => {
    registerStatusCleanup();

    await upsert(
      { ficheId, collectiviteId, status: 'failed' },
      {
        ficheId,
        collectiviteId,
        status: 'processed',
        fingerprint: firstFingerprint,
      }
    );

    expect(await readStored()).toEqual([
      {
        ficheId,
        status: 'processed',
        fingerprint: firstFingerprint,
        retryCount: 0,
      },
    ]);
  });

  it("upsertAnalyses n'écrit pas le statut d'une fiche donnée avec une autre CT que la sienne", async () => {
    registerStatusCleanup();

    await upsert(
      { ficheId: neighborFicheId, collectiviteId, status: 'failed' },
      { ficheId, collectiviteId, status: 'failed' }
    );

    expect(await readStored()).toEqual([
      { ficheId, status: 'failed', fingerprint: null, retryCount: 1 },
    ]);
  });

  it("upsertAnalyses n'écrit pas le statut d'une fiche supprimée physiquement, et écrit celui des autres fiches", async () => {
    registerStatusCleanup();
    const deletedFiche = await createFicheAndCleanupFunction({
      caller,
      ficheInput: { collectiviteId, titre: 'Fiche supprimée avant écriture' },
    });
    await deletedFiche.ficheCleanup();

    await upsert(
      { ficheId: deletedFiche.ficheId, collectiviteId, status: 'failed' },
      { ficheId, collectiviteId, status: 'failed' }
    );

    expect(await readStored([deletedFiche.ficheId, ficheId])).toEqual([
      { ficheId, status: 'failed', fingerprint: null, retryCount: 1 },
    ]);
  });

  it("chaque écriture met la date d'analyse à l'heure de la base", async () => {
    registerStatusCleanup();
    const beforeInsert = await readDatabaseNow();
    await upsert({ ficheId, collectiviteId, status: 'failed' });
    const afterInsert = await readDatabaseNow();
    const insertedAnalyzedAt = await readAnalyzedAt();

    await upsert({
      ficheId,
      collectiviteId,
      status: 'processed',
      fingerprint: secondFingerprint,
    });
    const afterUpdate = await readDatabaseNow();
    const updatedAnalyzedAt = await readAnalyzedAt();

    expect({
      insertedWithinInsert:
        insertedAnalyzedAt !== undefined &&
        insertedAnalyzedAt >= beforeInsert &&
        insertedAnalyzedAt <= afterInsert,
      updatedWithinUpdate:
        updatedAnalyzedAt !== undefined &&
        updatedAnalyzedAt >= afterInsert &&
        updatedAnalyzedAt <= afterUpdate,
    }).toEqual({ insertedWithinInsert: true, updatedWithinUpdate: true });
  });

  it('deleteAnalyses supprime les statuts des fiches données', async () => {
    registerStatusCleanup();
    await upsert(
      {
        ficheId,
        collectiviteId,
        status: 'processed',
        fingerprint: firstFingerprint,
      },
      { ficheId: otherFicheId, collectiviteId, status: 'failed' }
    );

    const deleteResult = await repository.deleteAnalyses({
      ficheIds: [ficheId],
    });

    expect({ deleteResult, stored: await readStored() }).toEqual({
      deleteResult: { success: true, data: undefined },
      stored: [
        {
          ficheId: otherFicheId,
          status: 'failed',
          fingerprint: null,
          retryCount: 1,
        },
      ],
    });
  });

  it('deleteAnalyses sans fiche ne supprime aucun statut', async () => {
    registerStatusCleanup();
    await upsert({ ficheId, collectiviteId, status: 'failed' });

    const deleteResult = await repository.deleteAnalyses({ ficheIds: [] });

    expect({ deleteResult, stored: await readStored() }).toEqual({
      deleteResult: { success: true, data: undefined },
      stored: [{ ficheId, status: 'failed', fingerprint: null, retryCount: 1 }],
    });
  });

  it("deleteAnalyses dans la transaction de l'appelant ne supprime rien si elle est annulée", async () => {
    registerStatusCleanup();
    await upsert({ ficheId, collectiviteId, status: 'failed' });

    await runInRolledBackTransaction(async (tx) => {
      const deleteResult = await repository.deleteAnalyses({
        ficheIds: [ficheId],
        tx,
      });

      expect({
        deleteResult,
        storedInTransaction: await readStored(trackedFicheIds(), tx),
      }).toEqual({
        deleteResult: { success: true, data: undefined },
        storedInTransaction: [],
      });
    });

    expect(await readStored()).toEqual([
      { ficheId, status: 'failed', fingerprint: null, retryCount: 1 },
    ]);
  });

  it("la suppression physique d'une fiche supprime son statut", async () => {
    registerStatusCleanup();
    const deletedFiche = await createFicheAndCleanupFunction({
      caller,
      ficheInput: { collectiviteId, titre: 'Fiche supprimée physiquement' },
    });
    await upsert({
      ficheId: deletedFiche.ficheId,
      collectiviteId,
      status: 'processed',
      fingerprint: firstFingerprint,
    });

    const storedBeforeDeletion = await readStored([deletedFiche.ficheId]);

    await deletedFiche.ficheCleanup();

    expect({
      storedBeforeDeletion,
      storedAfterDeletion: await readStored([deletedFiche.ficheId]),
    }).toEqual({
      storedBeforeDeletion: [
        {
          ficheId: deletedFiche.ficheId,
          status: 'processed',
          fingerprint: firstFingerprint,
          retryCount: 0,
        },
      ],
      storedAfterDeletion: [],
    });
  });

  it('listAnalyses renvoie tous les statuts de la CT demandée', async () => {
    registerStatusCleanup();
    await upsert(
      {
        ficheId,
        collectiviteId,
        status: 'processed',
        fingerprint: firstFingerprint,
      },
      { ficheId: otherFicheId, collectiviteId, status: 'stale' }
    );

    const listResult = await repository.listAnalyses({ collectiviteId });

    expect(sortAnalysesByFicheId(listResult)).toEqual({
      success: true,
      data: sortBy(
        [
          {
            ficheId,
            collectiviteId,
            status: 'processed',
            fingerprint: firstFingerprint,
            analyzedAt: expect.any(Date),
          },
          {
            ficheId: otherFicheId,
            collectiviteId,
            status: 'stale',
            analyzedAt: expect.any(Date),
          },
        ],
        [(analysis) => analysis.ficheId]
      ),
    });
  });

  it("listAnalyses ne renvoie pas les statuts d'une autre CT", async () => {
    registerStatusCleanup();
    await upsert(
      {
        ficheId,
        collectiviteId,
        status: 'processed',
        fingerprint: firstFingerprint,
      },
      {
        ficheId: neighborFicheId,
        collectiviteId: neighborCollectiviteId,
        status: 'failed',
      }
    );

    const listResult = await repository.listAnalyses({
      collectiviteId: neighborCollectiviteId,
    });

    expect(listResult).toEqual({
      success: true,
      data: [
        {
          ficheId: neighborFicheId,
          collectiviteId: neighborCollectiviteId,
          status: 'failed',
          retryCount: 1,
          analyzedAt: expect.any(Date),
        },
      ],
    });
  });
});
