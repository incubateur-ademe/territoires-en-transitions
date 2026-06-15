import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { describe, expect, it, vi } from 'vitest';
import { AiPlanImportErrorEnum } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import {
  AiPlanImportJob,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job';
import { GenerateImportDraftService } from './generate-import-draft.service';
import { initialStepStates } from './run-import-pipeline';

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
  createdPlanId: null,
  createdAt: '2026-06-10T00:00:00Z',
  modifiedAt: '2026-06-10T00:00:00Z',
};

const tokens: TokenUsage = {
  promptTokens: 10,
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
  budget: '',
  statut: '',
};

type MockOverrides = {
  sourceContent?: string;
  generateStructured?: () => Promise<unknown>;
  save?: () => Promise<Result<{ planId: number; fichesCount: number }, never>>;
  markDone?: () => Promise<Result<AiPlanImportJob, string>>;
  markFailed?: () => Promise<Result<AiPlanImportJob, string>>;
  getById?: () => Promise<Result<AiPlanImportJob, string>>;
};

const buildMocks = (overrides: MockOverrides = {}) => {
  const markDone = vi.fn(overrides.markDone ?? (async () => success(job)));
  const markFailed = vi.fn(overrides.markFailed ?? (async () => success(job)));
  const jobRepository = {
    transitionToRunning: vi.fn(async () => success(job)),
    markFailed,
    markDone,
    getById: vi.fn(overrides.getById ?? (async () => success(job))),
  } as unknown as AiPlanImportJobRepository;

  const removeDocument = vi.fn(async () => success(undefined));
  const documentStorage = {
    downloadDocument: vi.fn(async () =>
      success({
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
    .mockResolvedValueOnce(success({ data: { avis: 'Extraction ok' }, tokens }));
  const llm = {
    generateStructured: overrides.generateStructured
      ? vi.fn(overrides.generateStructured)
      : defaultLlm,
  } as unknown as LlmService;

  const save = vi.fn(
    overrides.save ?? (async () => success({ planId: 7, fichesCount: 1 }))
  );
  const importPlanService = { save } as unknown as ImportPlanService;

  const transactionManager = {
    executeSingle: vi.fn(async (operation) => operation({} as Transaction)),
  } as unknown as TransactionManager;

  return {
    jobRepository,
    documentStorage,
    llm,
    importPlanService,
    transactionManager,
    save,
    removeDocument,
  };
};

const buildService = (mocks: ReturnType<typeof buildMocks>) =>
  new GenerateImportDraftService(
    mocks.jobRepository,
    mocks.documentStorage,
    mocks.llm,
    mocks.importPlanService,
    mocks.transactionManager
  );

describe('GenerateImportDraftService', () => {
  it('crée le plan, marque le job done avec le plan créé et supprime la source', async () => {
    const mocks = buildMocks();
    const service = buildService(mocks);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({ success: true });
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        collectiviteId: 10,
        planInput: expect.objectContaining({ nom: 'Plan importé' }),
      })
    );
    expect(mocks.jobRepository.markDone).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-1', createdPlanId: 7 })
    );
    expect(mocks.removeDocument).toHaveBeenCalledWith({
      bucketId: 'ai-plan-import-sources',
      key: '10/abc',
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
    expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith({
      id: 'job-1',
      error: 'Création du plan impossible : Plan invalide',
      stepStates: initialStepStates(),
    });
  });

  it('marque le job failed quand la création du plan lève une exception (seam en transaction partagée)', async () => {
    const mocks = buildMocks();
    mocks.save.mockImplementation(() => {
      throw new Error('insert en conflit');
    });
    const service = buildService(mocks);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({ success: true });
    expect(mocks.jobRepository.markDone).not.toHaveBeenCalled();
    expect(mocks.jobRepository.markFailed).toHaveBeenCalledWith({
      id: 'job-1',
      error: 'Création du plan impossible : insert en conflit',
      stepStates: initialStepStates(),
    });
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
      error: 'Import interrompu: boom réseau',
      stepStates: initialStepStates(),
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
      stepStates: initialStepStates(),
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
  });
});
