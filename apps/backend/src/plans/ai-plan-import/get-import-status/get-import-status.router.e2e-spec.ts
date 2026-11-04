import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { LlmRepository } from '@tet/backend/utils/llm/repositories/llm.repository';
import { emptyTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { GenerateImportDraftWorker } from '../generate-import-draft/generate-import-draft.worker';
import { aiPlanImportJobTable } from '../models/ai-plan-import-job.table';
import { createEmptyExtractedAction } from '../models/extracted-action';
import { ImportCheckpoint } from '../models/import-checkpoint';
import { initialStepStates } from '../pipeline/run-import-pipeline';

/** Ces lectures ne doivent jamais déclencher un appel au fournisseur. */
class ReadOnlyLlmRepository extends LlmRepository {
  readonly maxConcurrentCalls = 1;
  readonly maxInputTokensPerMinute = null;
  readonly maxRequestsPerMinute = null;
  readonly capabilities = { ocr: false, strategy: 'whole-document' as const };

  maxInputTokensFor() {
    return 60_000;
  }

  modelFor() {
    return 'fake-model';
  }

  async complete(): Promise<never> {
    throw new Error('Un suivi de job ne doit pas appeler le LLM');
  }
}

describe('Suivi des imports IA', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder
          .overrideProvider(LlmService)
          .useValue(new LlmService(new ReadOnlyLlmRepository()));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
    db = await getTestDatabase(app);
    router = await getTestRouter(app);
  });

  afterAll(async () => {
    await app?.close();
  });

  const createContext = async () => {
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
      collectivite: { accesRestreint: true },
    });
    return {
      collectiviteId: collectivite.id,
      user,
      api: router.createCaller({ user: getAuthUserFromUserCredentials(user) })
        .plans.aiImport,
    };
  };

  const insertJob = async (
    context: Awaited<ReturnType<typeof createContext>>,
    overrides: Partial<typeof aiPlanImportJobTable.$inferInsert> = {}
  ) => {
    const [job] = await db.db
      .insert(aiPlanImportJobTable)
      .values({
        collectiviteId: context.collectiviteId,
        createdBy: context.user.id,
        status: 'failed',
        options: {
          planName: 'Plan de transition',
          instructions: 'Instructions privées',
          withVerifications: false,
          withSousActions: false,
          disabledFields: [],
        },
        sourcePath: 'private/source-document.pdf',
        stepStates: initialStepStates(),
        error: 'Traitement interrompu',
        finishedAt: '2026-11-04T10:05:00Z',
        ...overrides,
      })
      .returning();
    return job;
  };

  test('retrouve un échec sans plan, avec ses métadonnées et sans le document source', async () => {
    const context = await createContext();
    const job = await insertJob(context);

    const status = await context.api.getAiImportStatus({ jobId: job.id });
    const recent = await context.api.listRecentAiImports({
      collectiviteId: context.collectiviteId,
    });

    expect(status).toMatchObject({
      jobId: job.id,
      status: 'failed',
      planName: 'Plan de transition',
      profile: 'generic',
      createdAt: job.createdAt,
      finishedAt: job.finishedAt,
      createdPlanId: null,
      resumable: false,
      report: {
        qualitativeReview: null,
        issues: [
          {
            kind: 'processing-error',
            code: 'IMPORT_FAILED',
            message: 'Traitement interrompu',
          },
        ],
      },
    });
    expect(recent).toEqual({ items: [status], nextCursor: null });
    expect(status).not.toHaveProperty('sourcePath');
    expect(status).not.toHaveProperty('options');
    expect(status).not.toHaveProperty('checkpoint');
    expect(status).not.toHaveProperty('draft');
    expect(JSON.stringify(recent)).not.toContain(job.sourcePath);
    expect(JSON.stringify(recent)).not.toContain(job.options.instructions);
    expect(
      await context.api.getCurrentAiImport({
        collectiviteId: context.collectiviteId,
      })
    ).toBeNull();
  });

  test('conserve un avis qualitatif sans le classer comme avertissement', async () => {
    const context = await createContext();
    const job = await insertJob(context, {
      status: 'done',
      error: null,
      draft: { actions: [], qualitativeReview: 'Plan cohérent.' },
    });

    const status = await context.api.getAiImportStatus({ jobId: job.id });

    expect(status.qualitativeReview).toBe('Plan cohérent.');
    expect(status.report).toEqual({
      qualitativeReview: 'Plan cohérent.',
      issues: [],
    });
  });

  test('pagine tous les statuts de façon stable malgré les dates égales et les nouveaux imports', async () => {
    const context = await createContext();
    const sameDate = '2026-11-04T10:00:00.123456Z';
    const terminalJobs = await Promise.all([
      insertJob(context, { createdAt: sameDate }),
      insertJob(context, { createdAt: sameDate, status: 'done', error: null }),
      insertJob(context, { createdAt: sameDate }),
    ]);
    const runningJob = await insertJob(context, {
      status: 'running',
      error: null,
      createdAt: '2026-11-04T10:01:00Z',
      finishedAt: null,
    });
    const orderedIds = [
      runningJob.id,
      ...terminalJobs
        .map(({ id }) => id)
        .sort()
        .reverse(),
    ];

    const firstPage = await context.api.listRecentAiImports({
      collectiviteId: context.collectiviteId,
      limit: 2,
    });
    expect(firstPage.items.map(({ jobId }) => jobId)).toEqual(
      orderedIds.slice(0, 2)
    );
    expect(firstPage.nextCursor).toBe(orderedIds[1]);

    await insertJob(context, { createdAt: '2026-11-04T10:02:00Z' });
    const secondPage = await context.api.listRecentAiImports({
      collectiviteId: context.collectiviteId,
      limit: 2,
      cursor: firstPage.items[1].jobId,
    });
    expect(secondPage.items.map(({ jobId }) => jobId)).toEqual(
      orderedIds.slice(2)
    );
    expect(secondPage.nextCursor).toBeNull();
    expect(
      await context.api.getCurrentAiImport({
        collectiviteId: context.collectiviteId,
      })
    ).toMatchObject({ jobId: runningJob.id, status: 'running' });
  });

  test('valide le checkpoint en base avant de proposer ou effectuer une reprise', async () => {
    const context = await createContext();
    const checkpoint: ImportCheckpoint = {
      schemaVersion: 1,
      completedStep: 'extraction',
      currentDate: '2026-11-04T10:00:00Z',
      llm: { strategy: 'whole-document', maxInputTokens: 60_000 },
      progress: {
        actions: [
          createEmptyExtractedAction({ titre: 'Rénover les bâtiments' }),
        ],
        review: null,
        tokens: emptyTokenUsage(),
        stepStates: { ...initialStepStates(), reading: 'ok', extraction: 'ok' },
        warnings: [],
      },
      chunks: ['Contenu privé du document'],
      units: null,
      skeleton: null,
      source: {
        chunks: ['Contenu privé du document'],
        chunkIndexByAction: [0],
      },
      documentStats: null,
    };
    const job = await insertJob(context, { checkpoint });
    const repository = app.get(AiPlanImportJobRepository);

    expect(await repository.getCheckpoint(job.id)).toEqual({
      success: true,
      data: checkpoint,
    });
    const status = await context.api.getAiImportStatus({ jobId: job.id });
    expect(status.resumable).toBe(true);
    expect(JSON.stringify(status)).not.toContain('Contenu privé du document');
    expect(
      await context.api.listRecentAiImports({
        collectiviteId: context.collectiviteId,
      })
    ).toMatchObject({ items: [{ jobId: job.id, resumable: true }] });

    // Simule du JSON persistant que le type TypeScript ne peut pas garantir.
    const malformedCheckpoint = {
      ...checkpoint,
      progress: { ...checkpoint.progress, actions: [{ titre: 'Incomplète' }] },
    };
    await db.db
      .update(aiPlanImportJobTable)
      .set({
        checkpoint: sql`${JSON.stringify(malformedCheckpoint)}::jsonb`,
      })
      .where(eq(aiPlanImportJobTable.id, job.id));

    expect(await repository.getCheckpoint(job.id)).toEqual({
      success: false,
      error: 'INVALID_CHECKPOINT',
    });
    expect(
      await context.api.getAiImportStatus({ jobId: job.id })
    ).toMatchObject({ status: 'failed', resumable: false });
    expect(
      await context.api.listRecentAiImports({
        collectiviteId: context.collectiviteId,
      })
    ).toMatchObject({ items: [{ jobId: job.id, resumable: false }] });
    expect(
      await db.db.transaction((tx) => repository.resumeFailed(job.id, tx))
    ).toEqual({ success: false, error: 'JOB_NOT_RESUMABLE' });
  });

  test('isole les collectivités, y compris les curseurs, et revérifie les droits de lecture', async () => {
    const context = await createContext();
    const other = await createContext();
    const job = await insertJob(context);
    const otherJob = await insertJob(other);

    await expect(
      other.api.getAiImportStatus({ jobId: job.id })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      other.api.listRecentAiImports({ collectiviteId: context.collectiviteId })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      context.api.listRecentAiImports({
        collectiviteId: context.collectiviteId,
        cursor: otherJob.id,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    await db.db
      .update(utilisateurCollectiviteAccessTable)
      .set({ role: CollectiviteRole.LECTURE })
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, context.user.id),
          eq(
            utilisateurCollectiviteAccessTable.collectiviteId,
            context.collectiviteId
          )
        )
      );
    await expect(
      context.api.getAiImportStatus({ jobId: job.id })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      context.api.listRecentAiImports({
        collectiviteId: context.collectiviteId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      context.api.getCurrentAiImport({ collectiviteId: context.collectiviteId })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('limite la taille des pages et annonce le profil annexe comme indisponible', async () => {
    const context = await createContext();

    await expect(
      context.api.listRecentAiImports({
        collectiviteId: context.collectiviteId,
        limit: 51,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(
      context.api.listRecentAiImports({
        collectiviteId: context.collectiviteId,
        cursor: 'invalid',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(
      await context.api.getAiImportCapabilities({
        collectiviteId: context.collectiviteId,
      })
    ).toEqual({
      profiles: [
        { profile: 'generic', available: true },
        { profile: 'annexe-3-electrification', available: false },
      ],
    });
  });
});
