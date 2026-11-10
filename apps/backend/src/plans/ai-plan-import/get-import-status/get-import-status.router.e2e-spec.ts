import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
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
import { electrificationConfig } from '@tet/domain/plans';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { GenerateImportDraftWorker } from '../generate-import-draft/generate-import-draft.worker';
import { aiPlanImportJobTable } from '../models/ai-plan-import-job.table';
import { createEmptyExtractedAction } from '../models/extracted-action';
import { ImportCheckpoint } from '../models/import-checkpoint';
import { initialStepStates } from '../pipeline/run-import-pipeline';
import { AiPlanImportProfileEnum } from '../models/import-profile';
import {
  ELECTRIFICATION_CHECKPOINT_VERSION,
  ElectrificationExtractionCheckpoint,
} from '../electrification/extract-plan/electrification-extraction-checkpoint.schema';
import { electrificationDocumentTemplate } from '../electrification/extract-plan/electrification-document-template.constants';
import { ELECTRIFICATION_CONFIG } from '../electrification/electrification.constants';

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

const checkpoint: ImportCheckpoint = {
  schemaVersion: 1,
  completedStep: 'extraction',
  currentDate: '2026-11-04T10:00:00Z',
  llm: { strategy: 'whole-document', maxInputTokens: 60_000 },
  progress: {
    actions: [createEmptyExtractedAction({ titre: 'Rénover les bâtiments' })],
    review: null,
    tokens: emptyTokenUsage(),
    stepStates: { ...initialStepStates(), reading: 'ok', extraction: 'ok' },
    warnings: [],
  },
  chunks: ['Contenu privé du document'],
  units: null,
  skeleton: null,
  source: { chunks: ['Contenu privé du document'], chunkIndexByAction: [0] },
  documentStats: null,
};

const genericContract = {
  profile: 'generic',
  contractVersion: 1,
  catalogueVersion: null,
} as const;

const electrificationContract = {
  profile: AiPlanImportProfileEnum.ELECTRIFICATION,
  schemaVersion: ELECTRIFICATION_CHECKPOINT_VERSION,
  catalogueVersion: electrificationConfig.version,
  templateVersion: electrificationDocumentTemplate.version,
} as const;

const electrificationCheckpoint: ElectrificationExtractionCheckpoint = {
  ...electrificationContract,
  documentKind: 'docx',
  response: { engagements: [], axes: [], fiches: [] },
  sources: [
    {
      id: 'A1',
      section: 'A',
      text: 'Texte privé',
      location: 'Tableau A',
      links: [],
    },
  ],
  interpretations: [],
  tokens: emptyTokenUsage(),
};

describe('Suivi des imports IA', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  const catalogue = structuredClone(electrificationConfig);

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder.overrideProvider(ELECTRIFICATION_CONFIG).useValue(catalogue);
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

  test('retrouve uniquement les imports du plan demandé et filtre aussi les curseurs', async () => {
    const context = await createContext();
    const other = await createContext();
    const [plan, manualPlan, otherPlan] = await db.db
      .insert(axeTable)
      .values([
        { collectiviteId: context.collectiviteId, nom: 'Plan importé' },
        { collectiviteId: context.collectiviteId, nom: 'Plan manuel' },
        { collectiviteId: other.collectiviteId, nom: 'Autre collectivité' },
      ])
      .returning();
    const firstJob = await insertJob(context, {
      createdPlanId: plan.id,
      createdAt: '2026-11-04T10:00:00Z',
    });
    const latestJob = await insertJob(context, {
      createdPlanId: plan.id,
      createdAt: '2026-11-04T10:01:00Z',
      status: 'done',
      error: null,
    });
    const unrelatedJob = await insertJob(context, {
      createdAt: '2026-11-04T10:02:00Z',
    });
    await insertJob(other, { createdPlanId: otherPlan.id });
    const input = {
      collectiviteId: context.collectiviteId,
      planId: plan.id,
      limit: 1,
    };

    const firstPage = await context.api.listRecentAiImports(input);
    expect(firstPage.items.map(({ jobId }) => jobId)).toEqual([latestJob.id]);
    expect(firstPage.nextCursor).toBe(latestJob.id);
    const secondPage = await context.api.listRecentAiImports({
      ...input,
      cursor: latestJob.id,
    });
    expect(secondPage.items.map(({ jobId }) => jobId)).toEqual([firstJob.id]);
    expect(secondPage.nextCursor).toBeNull();
    for (const planId of [manualPlan.id, otherPlan.id]) {
      expect(
        await context.api.listRecentAiImports({ ...input, planId })
      ).toEqual({ items: [], nextCursor: null });
    }
    await expect(
      context.api.listRecentAiImports({ ...input, cursor: unrelatedJob.id })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(other.api.listRecentAiImports(input)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  test.each(['historique', 'explicite'] as const)(
    'propose la reprise du contrat générique v1 %s conservé en base',
    async (format) => {
      const context = await createContext();
      const {
        reading: _reading,
        scouting: _scouting,
        hierarchy: _hierarchy,
        secteurs: _secteurs,
        ...historicalSteps
      } = checkpoint.progress.stepStates;
      const storedCheckpoint =
        format === 'explicite'
          ? { ...checkpoint, ...genericContract, documentKind: 'pdf' }
          : {
              ...checkpoint,
              progress: { ...checkpoint.progress, stepStates: historicalSteps },
            };
      const contract = format === 'explicite' ? genericContract : {};
      const job = await insertJob(context);
      await db.db
        .update(aiPlanImportJobTable)
        .set({
          checkpoint: sql`${JSON.stringify(storedCheckpoint)}::jsonb`,
          options: { ...job.options, ...contract },
        })
        .where(eq(aiPlanImportJobTable.id, job.id));
      const repository = app.get(AiPlanImportJobRepository);

      expect(await repository.getCheckpoint(job.id)).toMatchObject({
        success: true,
        data: {
          ...checkpoint,
          ...contract,
          progress: {
            ...checkpoint.progress,
            stepStates:
              format === 'explicite'
                ? checkpoint.progress.stepStates
                : {
                    ...historicalSteps,
                    reading: 'skipped',
                    scouting: 'skipped',
                    hierarchy: 'skipped',
                    secteurs: 'skipped',
                  },
          },
        },
      });
      const status = await context.api.getAiImportStatus({ jobId: job.id });
      expect(status.profile).toBe('generic');
      expect(status.resumable).toBe(true);
      expect(JSON.stringify(status)).not.toContain('Contenu privé du document');
      expect(
        await context.api.listRecentAiImports({
          collectiviteId: context.collectiviteId,
        })
      ).toMatchObject({ items: [{ jobId: job.id, resumable: true }] });
    }
  );

  test.each([
    {
      name: 'profil de checkpoint inconnu',
      checkpointPatch: { profile: 'unknown' },
    },
    {
      name: 'version de schéma inconnue',
      checkpointPatch: { schemaVersion: 2 },
    },
    {
      name: 'version de contrat inconnue',
      checkpointPatch: { contractVersion: 2 },
    },
    {
      name: 'profil annexe dans les options',
      optionsPatch: { profile: 'annexe-3-electrification' },
    },
    {
      name: 'version de contrat différente dans les options',
      optionsPatch: { contractVersion: 2 },
    },
    {
      name: 'catalogue incompatible dans les options',
      optionsPatch: { catalogueVersion: 'annexe-v1' },
    },
    {
      name: 'action incomplète',
      checkpointPatch: {
        progress: {
          ...checkpoint.progress,
          actions: [{ titre: 'Incomplète' }],
        },
      },
    },
    {
      name: 'action sans rattachement source',
      checkpointPatch: {
        source: { ...checkpoint.source, chunkIndexByAction: [] },
      },
    },
    {
      name: 'rattachement vers une source inexistante',
      checkpointPatch: {
        source: { ...checkpoint.source, chunkIndexByAction: [1] },
      },
    },
  ])(
    'refuse la reprise sans modifier les données : $name',
    async ({ checkpointPatch, optionsPatch }) => {
      const context = await createContext();
      const storedCheckpoint = { ...checkpoint, ...checkpointPatch };
      const job = await insertJob(context);
      await db.db
        .update(aiPlanImportJobTable)
        .set({
          // Simule du JSON persistant que le type TypeScript ne peut pas garantir.
          checkpoint: sql`${JSON.stringify(storedCheckpoint)}::jsonb`,
          options: sql`${JSON.stringify({
            ...job.options,
            ...optionsPatch,
          })}::jsonb`,
        })
        .where(eq(aiPlanImportJobTable.id, job.id));
      const [before] = await db.db
        .select()
        .from(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.id, job.id));
      const repository = app.get(AiPlanImportJobRepository);

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
      const [after] = await db.db
        .select()
        .from(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.id, job.id));
      expect(after).toEqual(before);
    }
  );

  test('garde le compte rendu Électrification après la purge du checkpoint et propose une reprise sans plan', async () => {
    const context = await createContext();
    const job = await insertJob(context, { status: 'running', error: null });
    await db.db
      .update(aiPlanImportJobTable)
      .set({
        options: {
          ...job.options,
          ...electrificationContract,
          contractVersion: undefined,
        },
      })
      .where(eq(aiPlanImportJobTable.id, job.id));
    const repository = app.get(AiPlanImportJobRepository);
    const report = {
      qualitativeReview: null,
      issues: [
        {
          kind: 'document-error' as const,
          code: 'UNKNOWN_REFERENCE',
          message: 'Référence inconnue',
          location: 'Tableau A',
        },
      ],
    };

    expect(
      await repository.saveCheckpoint(
        job.id,
        job.attempt,
        electrificationCheckpoint
      )
    ).toEqual({ success: true, data: undefined });
    expect(
      await repository.markFailed({
        id: job.id,
        attempt: job.attempt,
        error: 'Validation impossible',
        report,
      })
    ).toMatchObject({ success: true });
    expect(
      await repository.getCheckpoint(
        job.id,
        AiPlanImportProfileEnum.ELECTRIFICATION
      )
    ).toEqual({ success: true, data: electrificationCheckpoint });
    const status = await context.api.getAiImportStatus({ jobId: job.id });
    expect(status).toMatchObject({
      resumable: true,
      createdPlanId: null,
      report,
    });
    expect(JSON.stringify(status)).not.toContain('Texte privé');

    await repository.purgeFailedCheckpoints(context.collectiviteId);

    expect(
      await context.api.getAiImportStatus({ jobId: job.id })
    ).toMatchObject({ resumable: false, report });
    expect(
      await repository.getCheckpoint(
        job.id,
        AiPlanImportProfileEnum.ELECTRIFICATION
      )
    ).toEqual({ success: true, data: null });
  });

  test('un catalogue invalide bloque la reprise Électrification sans bloquer un import générique', async () => {
    const context = await createContext();
    const job = await insertJob(context);
    const genericContext = await createContext();
    const genericJob = await insertJob(genericContext, { checkpoint });
    await db.db
      .update(aiPlanImportJobTable)
      .set({
        options: {
          ...job.options,
          ...electrificationContract,
          contractVersion: undefined,
        },
        checkpoint: electrificationCheckpoint,
      })
      .where(eq(aiPlanImportJobTable.id, job.id));
    const repository = app.get(AiPlanImportJobRepository);
    const before = await repository.getById(job.id);
    const version = catalogue.version;
    catalogue.version = '';
    try {
      expect(
        await context.api.getAiImportStatus({ jobId: job.id })
      ).toMatchObject({ resumable: false });
      expect(
        await repository.getCheckpoint(
          job.id,
          AiPlanImportProfileEnum.ELECTRIFICATION
        )
      ).toEqual({ success: false, error: 'INVALID_CHECKPOINT' });
      expect(
        await db.db.transaction((tx) => repository.resumeFailed(job.id, tx))
      ).toEqual({ success: false, error: 'JOB_NOT_RESUMABLE' });
      expect(await repository.getById(job.id)).toEqual(before);
      expect(
        await genericContext.api.getAiImportStatus({ jobId: genericJob.id })
      ).toMatchObject({ resumable: true });
      expect(await repository.getCheckpoint(genericJob.id)).toEqual({
        success: true,
        data: checkpoint,
      });
    } finally {
      catalogue.version = version;
    }
  });

  test.each([
    { name: 'profil différent', checkpointPatch: { profile: 'generic' } },
    {
      name: 'version technique différente',
      checkpointPatch: { schemaVersion: 2 },
    },
    {
      name: 'canevas différent',
      checkpointPatch: { templateVersion: 'unknown' },
    },
    {
      name: 'catalogue différent',
      checkpointPatch: { catalogueVersion: 'other' },
    },
    {
      name: 'catalogue périmé dans le job et le checkpoint',
      checkpointPatch: { catalogueVersion: 'old' },
      optionsPatch: { catalogueVersion: 'old' },
    },
    {
      name: 'version technique du job différente',
      optionsPatch: { schemaVersion: 2 },
    },
    {
      name: 'canevas du job différent',
      optionsPatch: { templateVersion: 'unknown' },
    },
    {
      name: 'version de contrat générique dans un job Électrification',
      optionsPatch: { contractVersion: 1 },
    },
  ])(
    'bloque une reprise Électrification incompatible : $name',
    async ({ checkpointPatch, optionsPatch }) => {
      const context = await createContext();
      const job = await insertJob(context);
      await db.db
        .update(aiPlanImportJobTable)
        .set({
          options: sql`${JSON.stringify({
            ...job.options,
            ...electrificationContract,
            ...optionsPatch,
          })}::jsonb`,
          checkpoint: sql`${JSON.stringify({
            ...electrificationCheckpoint,
            ...checkpointPatch,
          })}::jsonb`,
        })
        .where(eq(aiPlanImportJobTable.id, job.id));
      const repository = app.get(AiPlanImportJobRepository);

      expect(
        await repository.getCheckpoint(
          job.id,
          AiPlanImportProfileEnum.ELECTRIFICATION
        )
      ).toEqual({ success: false, error: 'INVALID_CHECKPOINT' });
      expect(
        await context.api.getAiImportStatus({ jobId: job.id })
      ).toMatchObject({ resumable: false });
      expect(
        await db.db.transaction((tx) => repository.resumeFailed(job.id, tx))
      ).toEqual({ success: false, error: 'JOB_NOT_RESUMABLE' });
    }
  );

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
      other.api.getAiImportCapabilities({
        collectiviteId: context.collectiviteId,
      })
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
    await expect(
      context.api.getAiImportCapabilities({
        collectiviteId: context.collectiviteId,
      })
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
