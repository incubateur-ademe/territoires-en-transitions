import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { AI_PLAN_IMPORT_QUEUE_NAME } from '../ai-plan-import.queue';
import { GenerateImportDraftWorker } from '../generate-import-draft/generate-import-draft.worker';
import { aiPlanImportJobTable } from '../models/ai-plan-import-job.table';
import { ImportQuestion } from '../models/import-question';
import { initialStepStates } from '../pipeline/run-import-pipeline';

const level = (exampleTitle: string, count: number) => ({
  exampleTitle,
  examplePage: 37,
  count,
});

const question: ImportQuestion = {
  kind: 'action-level',
  axes: level('Limiter les déchets verts', 5),
  fiches: level('Accompagner les habitants', 16),
  etapes: level('Diagnostiquer et orienter', 54),
  proposed: 'fiche',
  answer: null,
};

describe("Réponse à la question d'un import IA", () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  const queued: { data: unknown; opts: { jobId?: string } }[] = [];

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder
          .overrideProvider(GenerateImportDraftWorker)
          .useValue({ onModuleInit: () => undefined });
        builder
          .overrideProvider(getQueueToken(AI_PLAN_IMPORT_QUEUE_NAME))
          .useValue({
            add: async (
              _name: string,
              data: unknown,
              opts: { jobId?: string }
            ) => {
              queued.push({ data, opts });
              return { id: 'fake-job' };
            },
          });
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
    });
    return {
      collectiviteId: collectivite.id,
      user,
      api: router.createCaller({ user: getAuthUserFromUserCredentials(user) })
        .plans.aiImport,
    };
  };

  const insertAwaitingJob = async (
    context: Awaited<ReturnType<typeof createContext>>,
    overrides: Partial<typeof aiPlanImportJobTable.$inferInsert> = {}
  ) => {
    const [job] = await db.db
      .insert(aiPlanImportJobTable)
      .values({
        collectiviteId: context.collectiviteId,
        createdBy: context.user.id,
        status: 'awaiting_answer',
        options: {
          planName: 'PLPDMA',
          instructions: '',
          withVerifications: false,
          withSousActions: true,
          disabledFields: [],
        },
        sourcePath: 'private/source-document.pdf',
        stepStates: { ...initialStepStates(), reading: 'ok' },
        question,
        ...overrides,
      })
      .returning();
    return job;
  };

  test('expose la question au suivi, puis remet l’import en file avec la réponse', async () => {
    const context = await createContext();
    const job = await insertAwaitingJob(context);

    const status = await context.api.getAiImportStatus({ jobId: job.id });
    expect(status).toMatchObject({
      status: 'awaiting_answer',
      question: { ...question, answer: null },
      content: null,
    });
    const current = await context.api.getCurrentAiImport({
      collectiviteId: context.collectiviteId,
    });
    expect(current?.jobId).toBe(job.id);

    await expect(
      context.api.answerAiImportQuestion({
        jobId: job.id,
        answer: { kind: 'action-level', actionLevel: 'etape' },
      })
    ).resolves.toEqual({ jobId: job.id });

    const [answered] = await db.db
      .select()
      .from(aiPlanImportJobTable)
      .where(eq(aiPlanImportJobTable.id, job.id));
    expect(answered).toMatchObject({ status: 'pending', attempt: 1 });
    expect(answered.question?.answer).toMatchObject({
      actionLevel: 'etape',
      answeredBy: context.user.id,
    });
    expect(queued.at(-1)).toMatchObject({
      data: { jobId: job.id, executionAttempt: 1 },
      opts: { jobId: expect.stringMatching(new RegExp(`^${job.id}-reponse-`)) },
    });
    const after = await context.api.getAiImportStatus({ jobId: job.id });
    expect(after.question?.answer).toEqual({ actionLevel: 'etape' });

    await expect(
      context.api.answerAiImportQuestion({
        jobId: job.id,
        answer: { kind: 'action-level', actionLevel: 'fiche' },
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  test('cache l’import aux membres des autres collectivités', async () => {
    const owner = await createContext();
    const other = await createContext();
    const job = await insertAwaitingJob(owner);

    await expect(
      other.api.answerAiImportQuestion({
        jobId: job.id,
        answer: { kind: 'action-level', actionLevel: 'fiche' },
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('un import en attente occupe sa collectivité', async () => {
    const context = await createContext();
    await insertAwaitingJob(context);

    await expect(
      insertAwaitingJob(context, { status: 'pending', question: null })
    ).rejects.toThrow();
  });

  test('sans réponse au-delà de 7 jours, l’import échoue et libère la collectivité', async () => {
    const context = await createContext();
    const job = await insertAwaitingJob(context, {
      modifiedAt: sql`now() - interval '8 days'` as unknown as string,
    });

    await expect(
      context.api.answerAiImportQuestion({
        jobId: job.id,
        answer: { kind: 'action-level', actionLevel: 'fiche' },
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    const status = await context.api.getAiImportStatus({ jobId: job.id });
    expect(status.status).toBe('failed');
    expect(
      await context.api.getCurrentAiImport({
        collectiviteId: context.collectiviteId,
      })
    ).toBeNull();
  });
});
