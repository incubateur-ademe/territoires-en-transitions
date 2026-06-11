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
} from '../models/ai-plan-import-job.table';
import { GenerateImportDraftService } from './generate-import-draft.service';
import { initialStepStates } from './run-import-pipeline';

const job: AiPlanImportJob = {
  id: 'job-1',
  collectiviteId: 10,
  createdBy: 'user-1',
  status: AiPlanImportJobStatusEnum.PENDING,
  options: {
    instructions: '',
    withVerifications: false,
    withSousActions: false,
    disabledFields: [],
  },
  stepStates: initialStepStates(),
  sourcePath: '10/abc',
  draft: null,
  error: null,
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
  markDone?: () => Promise<Result<AiPlanImportJob, string>>;
  markFailed?: () => Promise<Result<AiPlanImportJob, string>>;
};

const buildMocks = (overrides: MockOverrides = {}) => {
  const jobRepository = {
    transitionToRunning: vi.fn(async () => success(job)),
    markFailed: vi.fn(overrides.markFailed ?? (async () => success(job))),
    markDone: vi.fn(overrides.markDone ?? (async () => success(job))),
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

  return { jobRepository, documentStorage, llm, removeDocument };
};

describe('GenerateImportDraftService', () => {
  it('marque le job done au terme du run et supprime la source', async () => {
    const { jobRepository, documentStorage, llm, removeDocument } = buildMocks();
    const service = new GenerateImportDraftService(jobRepository, documentStorage, llm);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({ success: true });
    expect(jobRepository.markDone).toHaveBeenCalled();
    expect(removeDocument).toHaveBeenCalledWith({ bucketId: 'ai-plan-import-sources', key: '10/abc' });
  });

  it('marque le job failed et supprime la source quand la pipeline lève une exception', async () => {
    const { jobRepository, documentStorage, llm, removeDocument } = buildMocks({
      generateStructured: async () => {
        throw new Error('boom réseau');
      },
    });
    const service = new GenerateImportDraftService(jobRepository, documentStorage, llm);

    const result = await service.generate('job-1');

    expect(result).toEqual({
      success: false,
      error: {
        kind: 'interrupted',
        jobId: 'job-1',
        message: 'Import interrompu: boom réseau',
      },
    });
    expect(jobRepository.markFailed).toHaveBeenCalledWith({
      id: 'job-1',
      error: 'Import interrompu: boom réseau',
      stepStates: initialStepStates(),
    });
    expect(removeDocument).toHaveBeenCalledWith({ bucketId: 'ai-plan-import-sources', key: '10/abc' });
  });

  it("remonte un échec quand l'enregistrement du brouillon échoue après un run payé", async () => {
    const { jobRepository, documentStorage, llm } = buildMocks({
      markDone: async () => failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR),
    });
    const service = new GenerateImportDraftService(jobRepository, documentStorage, llm);

    const result = await service.generate('job-1');

    expect(jobRepository.markDone).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: {
        kind: 'draft_record_failed',
        jobId: 'job-1',
        cause: AiPlanImportErrorEnum.UPDATE_JOB_ERROR,
      },
    });
  });

  it("remonte un échec quand l'enregistrement de l'échec d'extraction échoue", async () => {
    const { jobRepository, documentStorage, llm } = buildMocks({
      sourceContent: '',
      markFailed: async () => failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR),
    });
    const service = new GenerateImportDraftService(jobRepository, documentStorage, llm);

    const result = await service.generate('job-1');

    expect(llm.generateStructured).not.toHaveBeenCalled();
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
