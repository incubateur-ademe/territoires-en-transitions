import { EnqueueCompletePlanSecteursService } from '@tet/backend/plans/fiches/fiche-secteurs/complete-plan-secteurs/enqueue-complete-plan-secteurs.service';
import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { PlanCreationError } from '@tet/backend/plans/plans/import-plan-aggregate/import.errors';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { NotifyPlanImportedService } from '../notify-plan-imported/notify-plan-imported.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { EffetAttenduService } from '@tet/backend/shared/effet-attendu/effet-attendu.service';
import { EffetAttendu } from '@tet/domain/shared';
import { Logger } from '@nestjs/common';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { AiPlanImportErrorEnum } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import {
  AiPlanImportJob,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job';
import { GenerateImportDraftService } from './generate-import-draft.service';
import { initialStepStates } from '../pipeline/run-import-pipeline';
import { AiPlanImportStepRunRepository } from '../ai-plan-import-step-run.repository';
import { ImportCheckpoint } from '../models/import-checkpoint';
import { ImportStepRun } from '../models/import-step-run';
import {
  LlmCallMetrics,
  sumLlmCallMetrics,
} from '../pipeline/compute-import-metrics';

const job: AiPlanImportJob = {
  id: 'job-1',
  collectiviteId: 10,
  createdBy: 'user-1',
  status: AiPlanImportJobStatusEnum.PENDING,
  options: {
    instructions: '',
    planName: 'Plan importé',
    withVerifications: false,
    withSousActions: false,
    disabledFields: [],
  },
  stepStates: initialStepStates(),
  sourcePath: '10/abc',
  draft: null,
  error: null,
  createdPlanId: 7,
  fichierId: 3,
  startedAt: null,
  finishedAt: null,
  stats: null,
  attempt: 0,
  createdAt: '2026-06-10T00:00:00Z',
  modifiedAt: '2026-06-10T00:00:00Z',
};

const tokens: TokenUsage = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const extractionAction = {
  axe: 'Axe 1',
  'sous-axe': '1.1',
  titre: '1.1.1 Action',
  description: '',
  'sous-actions': [],
  objectifs: '',
  'structure pilote': '',
  'direction ou service pilote': '',
  'personne pilote': '',
  partenaires: '',
  budget: '',
  financements: '',
  'moyens humains': '',
  priorite: '',
  'date de debut': '',
  'date de fin': '',
  statut: '',
};

type MockOverrides = {
  sourceContent?: string;
  maxInputTokens?: number;
  generateStructured?: () => Promise<unknown>;
  save?: () => Promise<Result<{ planId: number; fichesCount: number }, never>>;
  markDone?: () => Promise<Result<AiPlanImportJob, string>>;
  markFailed?: () => Promise<Result<AiPlanImportJob, string>>;
  getById?: () => Promise<Result<AiPlanImportJob, string>>;
  checkpoint?: Result<ImportCheckpoint | null, string>;
  /** Passage du job : au-delà de 0, une reprise. */
  attempt?: number;
  previousLlm?: LlmCallMetrics;
  sourceAvailable?: boolean;
  effetsAttendus?: EffetAttendu[];
};

const buildMocks = (overrides: MockOverrides = {}) => {
  const markDone = vi.fn(overrides.markDone ?? (async () => success(job)));
  const markFailed = vi.fn(overrides.markFailed ?? (async () => success(job)));
  const updateStepStates = vi.fn(async () => success(job));
  const runningJob = { ...job, attempt: overrides.attempt ?? 0 };
  const jobRepository = {
    transitionToRunning: vi.fn(async () => success(runningJob)),
    markFailed,
    markDone,
    updateStepStates,
    getById: vi.fn(overrides.getById ?? (async () => success(job))),
    getCheckpoint: vi.fn(async () => overrides.checkpoint ?? success(null)),
    saveCheckpoint: vi.fn(
      async (_id: string, _attempt: number, _checkpoint: ImportCheckpoint) =>
        success(undefined)
    ),
  } as unknown as AiPlanImportJobRepository;

  const removeDocument = vi.fn(async () => success(undefined));
  const documentStorage = {
    downloadDocument: vi.fn(async () =>
      overrides.sourceAvailable === false
        ? failure('READ_DOCUMENT_ERROR')
        : success({
            buffer: Buffer.from(
              overrides.sourceContent ?? 'axe,titre\n1,Action',
              'utf-8'
            ),
            mimeType: 'text/csv',
          })
    ),
    removeDocument,
  } as unknown as DocumentStorageService;

  const defaultLlm = vi
    .fn()
    .mockResolvedValueOnce(success({ data: [extractionAction], tokens }))
    .mockResolvedValueOnce(
      success({ data: { avis: 'Extraction ok' }, tokens })
    );
  const llm = {
    maxInputTokens: overrides.maxInputTokens ?? 900_000,
    capabilities: { ocr: false, strategy: 'whole-document' },
    maxInputTokensFor: () => overrides.maxInputTokens ?? 900_000,
    generateStructured: overrides.generateStructured
      ? vi.fn(overrides.generateStructured)
      : defaultLlm,
  } as unknown as LlmService;

  const save = vi.fn(
    overrides.save ?? (async () => success({ planId: 7, fichesCount: 1 }))
  );
  const importPlanService = { save } as unknown as ImportPlanService;

  const markAsImportedByAi = vi.fn(async () => success(undefined));
  const markAsImporting = vi.fn(async () => success(undefined));
  const markAsImportFailed = vi.fn(async () => success(undefined));
  const planVerificationRepository = {
    markAsImportedByAi,
    markAsImporting,
    markAsImportFailed,
  } as unknown as PlanVerificationRepository;

  const notifyPlanImported = vi.fn(async () => success(undefined));
  const notifyPlanImportedService = {
    notifyPlanImported,
  } as unknown as NotifyPlanImportedService;

  const transactionManager = {
    executeSingle: vi.fn(async (operation) => operation({} as Transaction)),
  } as unknown as TransactionManager;

  const capture = vi.fn();
  const trackingService = { capture } as unknown as TrackingService;
  const enqueueCompletePlanSecteursService = {
    enqueue: vi.fn(async () => undefined),
  } as unknown as EnqueueCompletePlanSecteursService;

  const insertStepRun = vi.fn(
    async (_jobId: string, _run: ImportStepRun, _attempt: number) =>
      success(undefined)
  );
  const stepRunRepository = {
    insert: insertStepRun,
    sumPreviousLlmCalls: vi.fn(async () =>
      success(overrides.previousLlm ?? sumLlmCallMetrics([]))
    ),
  } as unknown as AiPlanImportStepRunRepository;

  const effetAttenduService = {
    getEffetAttendu: vi.fn(async () => overrides.effetsAttendus ?? []),
  } as unknown as EffetAttenduService;

  return {
    jobRepository,
    effetAttenduService,
    documentStorage,
    llm,
    importPlanService,
    planVerificationRepository,
    notifyPlanImportedService,
    transactionManager,
    trackingService,
    capture,
    enqueueCompletePlanSecteursService,
    stepRunRepository,
    insertStepRun,
    save,
    markAsImportedByAi,
    markAsImporting,
    markAsImportFailed,
    notifyPlanImported,
    removeDocument,
  };
};

const buildService = (mocks: ReturnType<typeof buildMocks>) =>
  new GenerateImportDraftService(
    mocks.jobRepository,
    mocks.documentStorage,
    mocks.llm,
    mocks.importPlanService,
    mocks.planVerificationRepository,
    mocks.notifyPlanImportedService,
    mocks.transactionManager,
    mocks.trackingService,
    mocks.enqueueCompletePlanSecteursService,
    mocks.stepRunRepository,
    mocks.effetAttenduService
  );

describe('GenerateImportDraftService', () => {
  it('remplit le plan créé au lancement, marque le job done et supprime la source', async () => {
    const mocks = buildMocks();
    const service = buildService(mocks);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({ success: true });
    expect(mocks.markAsImportedByAi).toHaveBeenCalledWith(7, {});
    expect(mocks.notifyPlanImported).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: 7,
        collectiviteId: 10,
        recap: { axesCount: 1, sousAxesCount: 1, fichesCount: 1 },
      })
    );
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        collectiviteId: 10,
        planId: 7,
        planInput: expect.objectContaining({ nom: 'Plan importé' }),
      })
    );
    expect(mocks.markAsImporting).not.toHaveBeenCalled();
    expect(mocks.jobRepository.markDone).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-1', createdPlanId: 7 })
    );
    expect(mocks.capture).toHaveBeenCalledTimes(1);
    expect(mocks.capture).toHaveBeenCalledWith({
      distinctId: 'user-1',
      event: 'plans:import-ia:succeeded',
      properties: expect.objectContaining({
        collectiviteId: 10,
        jobId: 'job-1',
        planId: 7,
        axesCount: 1,
        sousAxesCount: 1,
        fichesCount: 1,
        durationSeconds: expect.any(Number),
      }),
    });
    expect(mocks.jobRepository.updateStepStates).toHaveBeenLastCalledWith(
      'job-1',
      0,
      {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
        scoring: 'skipped',
        consolidation: 'skipped',
        enrichment: 'skipped',
        secteurs: 'skipped',
        qualitativeReview: 'ok',
      }
    );
    expect(mocks.removeDocument).toHaveBeenCalledWith({
      bucketId: 'ai-plan-import-sources',
      key: '10/abc',
    });
  });

  it('propose les effets attendus lus en base et les donne aux fiches créées', async () => {
    const generateStructured = vi.fn(async ({ prompt }: { prompt: string }) => {
      if (prompt.includes('auditeur qualité')) {
        return success({ data: { avis: 'Extraction ok' }, tokens });
      }
      if (prompt.includes('agent de classement des actions')) {
        return success({ data: [{ index: 0, effetsAttendus: [25] }], tokens });
      }
      return success({ data: [extractionAction], tokens });
    });
    const mocks = buildMocks({
      generateStructured: generateStructured as never,
      effetsAttendus: [{ id: 25, nom: 'Efficacité énergétique', notice: null }],
    });

    const result = await buildService(mocks).generate('job-1');

    expect(result).toMatchObject({ success: true });
    const classementPrompt = generateStructured.mock.calls
      .map(([{ prompt }]) => prompt)
      .find((prompt) => prompt.includes('agent de classement des actions'));
    expect(classementPrompt).toContain('• 25 : Efficacité énergétique');
    expect(classementPrompt).not.toContain('"residentiel"');
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        planInput: expect.objectContaining({
          actions: [
            expect.objectContaining({
              effetsAttendus: [25],
              secteursProposes: undefined,
            }),
          ],
        }),
      })
    );
    expect(mocks.jobRepository.updateStepStates).toHaveBeenLastCalledWith(
      'job-1',
      0,
      expect.objectContaining({ secteurs: 'ok' })
    );
  });

  it('découpe un document trop long et en extrait les tranches une par une', async () => {
    const generateStructured = vi.fn(async ({ prompt }: { prompt: string }) =>
      prompt.includes('auditeur qualité')
        ? success({ data: { avis: 'Extraction ok' }, tokens })
        : success({ data: [extractionAction], tokens })
    );
    const mocks = buildMocks({
      maxInputTokens: 40,
      sourceContent: `axe,titre\n${'1,Action longue\n'.repeat(20)}`,
      generateStructured: generateStructured as never,
    });
    const service = buildService(mocks);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({ success: true });
    const extractionPrompts = generateStructured.mock.calls
      .map(([{ prompt }]) => prompt)
      .filter((prompt) => !prompt.includes('auditeur qualité'));
    expect(extractionPrompts.length).toBeGreaterThan(1);
    expect(extractionPrompts[1]).toContain(
      `Extrait 2 sur ${extractionPrompts.length}`
    );
    // L'en-tête du tableau est repris dans chaque tranche.
    for (const prompt of extractionPrompts) {
      expect(prompt).toContain('axe\ttitre\n1\tAction longue');
    }
    expect(mocks.jobRepository.markFailed).not.toHaveBeenCalled();
    expect(mocks.jobRepository.markDone).toHaveBeenCalled();
  });

  it('refuse un document trop long même découpé, sans appeler le modèle', async () => {
    const mocks = buildMocks({
      maxInputTokens: 10,
      sourceContent: `axe,titre\n${'1,Action longue\n'.repeat(20)}`,
    });
    const service = buildService(mocks);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({ success: true });
    expect(mocks.llm.generateStructured).not.toHaveBeenCalled();
    expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job-1',
        error: expect.stringContaining('Document trop long'),
      })
    );
    expect(mocks.capture).toHaveBeenCalledWith({
      distinctId: 'user-1',
      event: 'plans:import-ia:failed',
      properties: expect.objectContaining({
        collectiviteId: 10,
        jobId: 'job-1',
        failedStep: 'reading',
        reason: 'document_too_long',
      }),
    });
  });

  it('marque le job failed quand la création du plan échoue', async () => {
    const mocks = buildMocks({
      save: async () => failure({ message: 'Plan invalide' } as never),
    });
    const service = buildService(mocks);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({ success: true });
    expect(mocks.jobRepository.markDone).not.toHaveBeenCalled();
    expect(mocks.notifyPlanImported).not.toHaveBeenCalled();
    expect(mocks.capture).toHaveBeenCalledTimes(1);
    expect(mocks.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'plans:import-ia:failed',
        properties: expect.objectContaining({
          reason: 'plan_creation_failed',
        }),
      })
    );
    expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job-1',
        error: 'Création du plan impossible : Plan invalide',
        // L'avancement reste celui de la dernière étape, pas remis à zéro.
        stepStates: undefined,
        draft: expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({ titre: 'Action' }),
          ]),
        }),
      })
    );
  });

  it('marque le job failed quand la création du plan lève une exception (seam en transaction partagée)', async () => {
    const mocks = buildMocks();
    mocks.save.mockImplementation(() => {
      throw new Error('Failed query: insert into "axe"', {
        cause: new Error('duplicate key value violates unique constraint'),
      });
    });
    const logged = vi.spyOn(Logger.prototype, 'error');
    onTestFinished(() => logged.mockRestore());
    const service = buildService(mocks);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({ success: true });
    expect(mocks.jobRepository.markDone).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining('duplicate key value violates unique constraint')
    );
    expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job-1',
        error: 'Création du plan impossible : erreur inattendue',
        stepStates: undefined,
        draft: expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({ titre: 'Action' }),
          ]),
        }),
      })
    );
  });

  it("journalise l'erreur Postgres d'une création en échec, sans la montrer à l'utilisateur", async () => {
    const mocks = buildMocks();
    // Forme relancée par le TransactionManager quand `tx` est partagé.
    mocks.save.mockImplementation(() => {
      throw failure(
        new PlanCreationError('DATABASE_ERROR'),
        new Error('valeur trop longue pour le titre')
      );
    });
    const logged = vi.spyOn(Logger.prototype, 'error');
    onTestFinished(() => logged.mockRestore());
    const service = buildService(mocks);

    await service.generate('job-1');

    expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        error:
          'Création du plan impossible : Erreur lors de la création du plan : DATABASE_ERROR',
      })
    );
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining('valeur trop longue pour le titre')
    );
    expect(mocks.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          reason: 'plan_creation_failed',
        }),
      })
    );
    expect(JSON.stringify(mocks.capture.mock.calls)).not.toContain(
      'valeur trop longue'
    );
  });

  it("cite le statut HTTP d'une étape en échec, mais n'envoie que le type à PostHog", async () => {
    const mocks = buildMocks({
      generateStructured: async () =>
        failure({ kind: 'api_error', httpStatus: 503 }),
    });

    await buildService(mocks).generate('job-1');

    expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Étape extraction en échec (api_error 503)',
      })
    );
    expect(mocks.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ reason: 'api_error' }),
      })
    );
  });

  it('marque le job failed et supprime la source quand la pipeline lève une exception', async () => {
    const mocks = buildMocks({
      generateStructured: async () => {
        throw new Error('boom réseau');
      },
    });
    const service = buildService(mocks);

    const result = await service.generate('job-1');

    expect(result).toEqual({
      success: false,
      error: {
        kind: 'interrupted',
        jobId: 'job-1',
        message: 'Import interrompu: boom réseau',
      },
    });
    expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith({
      id: 'job-1',
      attempt: 0,
      error: 'Import interrompu: boom réseau',
    });
    expect(mocks.removeDocument).toHaveBeenCalledWith({
      bucketId: 'ai-plan-import-sources',
      key: '10/abc',
    });
  });

  it('marque failed et supprime la source sur échec terminal hors-process', async () => {
    const mocks = buildMocks();
    const service = buildService(mocks);

    await service.recordTerminalFailure('job-1', 'Import interrompu: stall');

    expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith({
      id: 'job-1',
      error: 'Import interrompu: stall',
    });
    expect(mocks.removeDocument).toHaveBeenCalledWith({
      bucketId: 'ai-plan-import-sources',
      key: '10/abc',
    });
  });

  it('ne supprime pas de source quand la ligne du job a disparu', async () => {
    const mocks = buildMocks({
      getById: async () => failure(AiPlanImportErrorEnum.JOB_NOT_FOUND),
    });
    const service = buildService(mocks);

    await service.recordTerminalFailure('job-1', 'Import interrompu: stall');

    expect(mocks.jobRepository.markFailed).toHaveBeenCalled();
    expect(mocks.removeDocument).not.toHaveBeenCalled();
  });

  it("remonte un échec quand l'enregistrement de l'échec d'extraction échoue", async () => {
    const mocks = buildMocks({
      sourceContent: '',
      markFailed: async () => failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR),
    });
    const service = buildService(mocks);

    const result = await service.generate('job-1');

    expect(mocks.llm.generateStructured).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: {
        kind: 'failure_record_failed',
        jobId: 'job-1',
        cause: AiPlanImportErrorEnum.UPDATE_JOB_ERROR,
      },
    });
    // Rien n'est enregistré : pas d'événement pour un échec qui n'existe pas en base.
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it('passe le plan du job en échec quand le job échoue', async () => {
    const mocks = buildMocks({
      save: async () => failure({ message: 'Plan invalide' } as never),
    });
    const service = buildService(mocks);

    await service.generate('job-1');

    expect(mocks.markAsImportFailed).toHaveBeenCalledWith(7);
  });

  it("crée le plan d'un job lancé avant la création au lancement", async () => {
    const legacyJob = { ...job, createdPlanId: null };
    const mocks = buildMocks();
    vi.mocked(mocks.jobRepository.transitionToRunning).mockResolvedValue(
      success(legacyJob)
    );
    const service = buildService(mocks);

    await service.generate('job-1');

    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ planId: undefined })
    );
    expect(mocks.markAsImporting).toHaveBeenCalledWith(7, {});
    expect(mocks.markAsImportedByAi).toHaveBeenCalledWith(7, {});
  });

  it('enregistre chaque étape et le résumé chiffré du job', async () => {
    const mocks = buildMocks();
    const service = buildService(mocks);

    await service.generate('job-1');

    const steps = mocks.insertStepRun.mock.calls.map(([, run]) => run.step);
    expect(steps).toEqual([
      'document',
      'reading',
      'scouting',
      'extraction',
      'hierarchy',
      'scoring',
      'consolidation',
      'enrichment',
      'secteurs',
      'qualitativeReview',
      'persistence',
    ]);
    expect(mocks.jobRepository.markDone).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: expect.objectContaining({
          schemaVersion: 1,
          content: expect.objectContaining({ actions: 1, fichesCreated: 1 }),
          document: expect.objectContaining({ kind: 'csv' }),
          llm: expect.objectContaining({ strategy: 'whole-document' }),
        }),
      })
    );
  });

  describe('reprise', () => {
    /** Les points de reprise d'un import mené jusqu'au bout. */
    const checkpointsOfFullRun = async (): Promise<ImportCheckpoint[]> => {
      const mocks = buildMocks();
      await buildService(mocks).generate('job-1');
      return vi
        .mocked(mocks.jobRepository.saveCheckpoint)
        .mock.calls.map(([, , checkpoint]) =>
          JSON.parse(JSON.stringify(checkpoint))
        );
    };

    it('enregistre un point de reprise après chaque étape, avec le document lu', async () => {
      const checkpoints = await checkpointsOfFullRun();

      expect(checkpoints.map(({ completedStep }) => completedStep)).toEqual([
        'reading',
        'scouting',
        'extraction',
        'hierarchy',
        'scoring',
        'consolidation',
        'enrichment',
        'secteurs',
        'qualitativeReview',
      ]);
      for (const checkpoint of checkpoints) {
        expect(checkpoint.documentStats).toMatchObject({ kind: 'csv' });
      }
    });

    it('reprend après la dernière étape sans relire le document ni rappeler le modèle', async () => {
      const checkpoints = await checkpointsOfFullRun();
      const mocks = buildMocks({
        checkpoint: success(checkpoints[checkpoints.length - 1]),
        attempt: 1,
        previousLlm: {
          calls: 2,
          failedCalls: 0,
          rateLimited: 0,
          tokens,
          models: ['gemini-test'],
        },
      });

      const result = await buildService(mocks).generate('job-1');

      expect(result).toMatchObject({ success: true });
      expect(mocks.documentStorage.downloadDocument).not.toHaveBeenCalled();
      expect(mocks.llm.generateStructured).not.toHaveBeenCalled();
      expect(mocks.save).toHaveBeenCalledWith(
        expect.objectContaining({ planId: 7 })
      );
      expect(mocks.insertStepRun.mock.calls).toEqual([
        ['job-1', expect.objectContaining({ step: 'persistence' }), 1],
      ]);
      expect(mocks.jobRepository.markDone).toHaveBeenCalledWith(
        expect.objectContaining({
          stats: expect.objectContaining({
            document: expect.objectContaining({ kind: 'csv' }),
            llm: expect.objectContaining({
              calls: 2,
              models: ['gemini-test'],
            }),
            resumes: 1,
          }),
        })
      );
      expect(mocks.removeDocument).toHaveBeenCalled();
    });

    it('reprend après la dernière étape même quand le modèle a changé, sans la source', async () => {
      const checkpoints = await checkpointsOfFullRun();
      const mocks = buildMocks({
        checkpoint: success({
          ...checkpoints[checkpoints.length - 1],
          llm: { strategy: 'segmented', maxInputTokens: 100_000 },
        }),
        attempt: 1,
        sourceAvailable: false,
      });

      const result = await buildService(mocks).generate('job-1');

      expect(result).toMatchObject({ success: true });
      expect(mocks.documentStorage.downloadDocument).not.toHaveBeenCalled();
      expect(mocks.llm.generateStructured).not.toHaveBeenCalled();
      expect(mocks.jobRepository.markFailed).not.toHaveBeenCalled();
      expect(mocks.jobRepository.markDone).toHaveBeenCalledWith(
        expect.objectContaining({ attempt: 1, createdPlanId: 7 })
      );
    });

    it("reprend après l'extraction en ne rappelant le modèle que pour la suite", async () => {
      const checkpoints = await checkpointsOfFullRun();
      const afterExtraction = checkpoints.find(
        ({ completedStep }) => completedStep === 'extraction'
      );
      const generateStructured = vi.fn(async () =>
        success({ data: { avis: 'Extraction ok' }, tokens })
      );
      const mocks = buildMocks({
        checkpoint: success(afterExtraction ?? null),
        attempt: 1,
        generateStructured: generateStructured as never,
      });

      const result = await buildService(mocks).generate('job-1');

      expect(result).toMatchObject({ success: true });
      // Seule la revue qualitative reste à faire : l'extraction est acquise.
      expect(generateStructured).toHaveBeenCalledTimes(1);
      expect(mocks.save).toHaveBeenCalledWith(
        expect.objectContaining({
          planInput: expect.objectContaining({ nom: 'Plan importé' }),
        })
      );
      expect(mocks.jobRepository.markDone).toHaveBeenCalled();
    });

    it("reconnaît un tableur à la reprise d'un point de reprise antérieur au type du document", async () => {
      const checkpoints = await checkpointsOfFullRun();
      const { documentKind: _kind, ...afterReading } = checkpoints[0];
      const generateStructured = vi
        .fn()
        .mockResolvedValueOnce(
          success({
            data: [
              { ...extractionAction, axe: 'Axe 1' },
              { ...extractionAction, axe: 'Axe 2' },
            ],
            tokens,
          })
        )
        .mockResolvedValue(
          success({ data: { avis: 'Extraction ok' }, tokens })
        );
      const mocks = buildMocks({
        checkpoint: success(afterReading),
        attempt: 1,
        generateStructured: generateStructured as never,
      });

      await buildService(mocks).generate('job-1');

      expect(mocks.jobRepository.markDone).toHaveBeenCalledWith(
        expect.objectContaining({
          draft: expect.objectContaining({
            actions: [
              expect.objectContaining({ axe: 'Axe 1' }),
              expect.objectContaining({ axe: 'Axe 2' }),
            ],
          }),
        })
      );
    });

    it.each([
      ['un autre format', { schemaVersion: 99 }],
      [
        'un autre modèle',
        { llm: { strategy: 'segmented', maxInputTokens: 100_000 } },
      ],
    ])(
      'repart du document quand le point de reprise vient d’%s et que la source est là',
      async (_label, change) => {
        const checkpoints = await checkpointsOfFullRun();
        const mocks = buildMocks({
          checkpoint: success({
            ...checkpoints[0],
            ...change,
          } as unknown as ImportCheckpoint),
          attempt: 1,
        });

        const result = await buildService(mocks).generate('job-1');

        expect(result).toMatchObject({ success: true });
        expect(mocks.documentStorage.downloadDocument).toHaveBeenCalled();
        expect(mocks.llm.generateStructured).toHaveBeenCalledTimes(2);
      }
    );

    it("rend l'import non reprenable quand le point de reprise est inutilisable et la source supprimée", async () => {
      const checkpoints = await checkpointsOfFullRun();
      const mocks = buildMocks({
        checkpoint: success({
          ...checkpoints[0],
          llm: { strategy: 'segmented', maxInputTokens: 100_000 },
        }),
        attempt: 1,
        sourceAvailable: false,
      });

      const result = await buildService(mocks).generate('job-1');

      expect(result).toMatchObject({ success: true });
      expect(mocks.llm.generateStructured).not.toHaveBeenCalled();
      expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'job-1',
          attempt: 1,
          error: expect.stringContaining('point de reprise'),
          dropCheckpoint: true,
        })
      );
    });

    it('échoue sans relire le document quand le point de reprise est illisible', async () => {
      const mocks = buildMocks({
        checkpoint: failure(AiPlanImportErrorEnum.GET_JOB_ERROR),
        attempt: 1,
      });

      const result = await buildService(mocks).generate('job-1');

      expect(result).toMatchObject({ success: true });
      expect(mocks.documentStorage.downloadDocument).not.toHaveBeenCalled();
      expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'job-1', attempt: 1 })
      );
      // Le point de reprise reste en place : une nouvelle reprise le relira.
      expect(
        vi.mocked(mocks.jobRepository.markFailed).mock.calls[0][0]
      ).not.toHaveProperty('dropCheckpoint', true);
    });

    it("n'écrit qu'au nom du passage en cours", async () => {
      const checkpoints = await checkpointsOfFullRun();
      const mocks = buildMocks({
        checkpoint: success(checkpoints[1]),
        attempt: 2,
      });

      await buildService(mocks).generate('job-1');

      for (const [, attempt] of vi.mocked(mocks.jobRepository.saveCheckpoint)
        .mock.calls) {
        expect(attempt).toBe(2);
      }
      for (const [, attempt] of vi.mocked(mocks.jobRepository.updateStepStates)
        .mock.calls as unknown as [string, number][]) {
        expect(attempt).toBe(2);
      }
      expect(mocks.jobRepository.markDone).toHaveBeenCalledWith(
        expect.objectContaining({ attempt: 2 })
      );
    });
  });
});
