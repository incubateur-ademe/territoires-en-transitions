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
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { inArray, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { z } from 'zod';
import { FicheActionAnalysisRepository } from '../fiche-action-analysis.repository';
import { ficheActionAnalysisTable } from '../models/fiche-action-analysis.table';
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

describe('FicheAnalysisStatusRepository contract', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: FicheActionAnalysisRepository;
  let caller: FicheAnalysisCaller;
  let collectiviteId: number;
  let ficheId: number;
  let otherFicheId: number;
  let ficheWithoutStatusId: number;
  let neighborCollectiviteId: number;
  let neighborFicheId: number;

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

    const fiche = await createFicheAndCleanupFunction({
      caller,
      ficheInput: { collectiviteId, titre: 'Aménager des pistes cyclables' },
    });
    ficheId = fiche.ficheId;

    const otherFiche = await createFicheAndCleanupFunction({
      caller,
      ficheInput: { collectiviteId, titre: 'Développer le covoiturage' },
    });
    otherFicheId = otherFiche.ficheId;

    const ficheWithoutStatus = await createFicheAndCleanupFunction({
      caller,
      ficheInput: { collectiviteId, titre: 'Rénover les écoles' },
    });
    ficheWithoutStatusId = ficheWithoutStatus.ficheId;

    const neighbor = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    neighborCollectiviteId = neighbor.collectivite.id;
    const neighborFiche = await createFicheAndCleanupFunction({
      caller: router.createCaller({
        user: getAuthUserFromUserCredentials(neighbor.user),
      }),
      ficheInput: {
        collectiviteId: neighborCollectiviteId,
        titre: 'Fiche de la collectivité voisine',
      },
    });
    neighborFicheId = neighborFiche.ficheId;

    return async () => {
      await fiche.ficheCleanup();
      await otherFiche.ficheCleanup();
      await ficheWithoutStatus.ficheCleanup();
      await neighborFiche.ficheCleanup();
      await app.close();
    };
  });

  const toUpsert = (analysis: UpsertedAnalysis): FicheAnalysisUpsert =>
    ficheAnalysisUpsertSchema.parse(analysis);

  const upsert = async (...analyses: UpsertedAnalysis[]): Promise<void> => {
    const upsertResult = await repository.upsertAnalyses({
      analyses: analyses.map(toUpsert),
    });
    expect(upsertResult).toEqual({ success: true, data: undefined });
  };

  const readStored = async (): Promise<StoredAnalysis[]> =>
    db.db
      .select({
        ficheId: ficheActionAnalysisTable.ficheId,
        status: ficheActionAnalysisTable.status,
        fingerprint: ficheActionAnalysisTable.fingerprint,
        retryCount: ficheActionAnalysisTable.retryCount,
      })
      .from(ficheActionAnalysisTable)
      .where(
        inArray(ficheActionAnalysisTable.ficheId, [
          ficheId,
          otherFicheId,
          ficheWithoutStatusId,
          neighborFicheId,
        ])
      )
      .orderBy(ficheActionAnalysisTable.ficheId);

  const readDatabaseNow = async (): Promise<Date> => {
    const { rows } = await db.db.execute<{ now: string }>(
      sql`select clock_timestamp()::text as now`
    );
    return new Date(rows[0]?.now ?? Number.NaN);
  };

  const readAnalyzedAt = async (): Promise<Date | undefined> => {
    const [stored] = await db.db
      .select({ analyzedAt: ficheActionAnalysisTable.analyzedAt })
      .from(ficheActionAnalysisTable)
      .where(inArray(ficheActionAnalysisTable.ficheId, [ficheId]));
    return stored?.analyzedAt;
  };

  const registerStatusCleanup = (): void => {
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionAnalysisTable)
        .where(
          inArray(ficheActionAnalysisTable.ficheId, [
            ficheId,
            otherFicheId,
            ficheWithoutStatusId,
            neighborFicheId,
          ])
        );
    });
  };

  it("upsertAnalyses d'une fiche traitée écrit le statut et l'empreinte, et remet le compteur à 0", async () => {
    registerStatusCleanup();
    await upsert({ ficheId, collectiviteId, status: 'failed' });
    await upsert({ ficheId, collectiviteId, status: 'failed' });

    await upsert({
      ficheId,
      collectiviteId,
      status: 'processed',
      fingerprint: firstFingerprint,
    });

    expect(await readStored()).toEqual([
      {
        ficheId,
        status: 'processed',
        fingerprint: firstFingerprint,
        retryCount: 0,
      },
    ]);
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

    await deletedFiche.ficheCleanup();

    expect(
      await repository.listAnalyses({ ficheIds: [deletedFiche.ficheId] })
    ).toEqual({ success: true, data: [] });
  });

  it('listAnalyses renvoie les statuts des fiches demandées', async () => {
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

    const listResult = await repository.listAnalyses({
      ficheIds: [ficheId, ficheWithoutStatusId],
    });

    expect(listResult).toEqual({
      success: true,
      data: [
        {
          ficheId,
          collectiviteId,
          status: 'processed',
          fingerprint: firstFingerprint,
          analyzedAt: expect.any(Date),
        },
      ],
    });
  });

  it('listAnalysesOfAnalyzedCollectivites renvoie tous les statuts des CT qui ont au moins un statut', async () => {
    registerStatusCleanup();
    await upsert(
      {
        ficheId,
        collectiviteId,
        status: 'processed',
        fingerprint: firstFingerprint,
      },
      { ficheId: otherFicheId, collectiviteId, status: 'stale' },
      {
        ficheId: neighborFicheId,
        collectiviteId: neighborCollectiviteId,
        status: 'failed',
      }
    );

    const listResult = await repository.listAnalysesOfAnalyzedCollectivites();

    const ownAnalyses = (listResult.success ? listResult.data : [])
      .filter((analysis) =>
        [ficheId, otherFicheId, ficheWithoutStatusId, neighborFicheId].includes(
          analysis.ficheId
        )
      )
      .sort((a, b) => a.ficheId - b.ficheId);
    expect({ success: listResult.success, ownAnalyses }).toEqual({
      success: true,
      ownAnalyses: [
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
        {
          ficheId: neighborFicheId,
          collectiviteId: neighborCollectiviteId,
          status: 'failed',
          retryCount: 1,
          analyzedAt: expect.any(Date),
        },
      ].sort((a, b) => a.ficheId - b.ficheId),
    });
  });
});
