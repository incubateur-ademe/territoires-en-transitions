import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
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
  const repository = {
    getByIdRaw: vi.fn(async () => success(job)),
    transitionToRunning: vi.fn(async () => success(job)),
    markFailed: vi.fn(overrides.markFailed ?? (async () => success(job))),
    markDone: vi.fn(overrides.markDone ?? (async () => success(job))),
  } as unknown as AiPlanImportJobRepository;

  const remove = vi.fn(async () => ({ error: null }));
  const supabase = {
    client: {
      storage: {
        from: () => ({
          download: async () => ({
            data: {
              arrayBuffer: async () =>
                Buffer.from(
                  overrides.sourceContent ?? 'axe,titre\n1,Action',
                  'utf-8'
                ),
              type: 'text/csv',
            },
            error: null,
          }),
          remove,
        }),
      },
    },
  } as unknown as SupabaseService;

  const defaultLlm = vi
    .fn()
    .mockResolvedValueOnce(success({ data: [extractionAction], tokens }))
    .mockResolvedValueOnce(success({ data: { avis: 'Extraction ok' }, tokens }));
  const llm = {
    generateStructured: overrides.generateStructured
      ? vi.fn(overrides.generateStructured)
      : defaultLlm,
  } as unknown as LlmService;

  return { repository, supabase, llm, remove };
};

describe('GenerateImportDraftService', () => {
  it('marque le job done au terme du run et supprime la source', async () => {
    const { repository, supabase, llm, remove } = buildMocks();
    const service = new GenerateImportDraftService(repository, supabase, llm);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({ success: true });
    expect(repository.markDone).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith(['10/abc']);
  });

  it('marque le job failed et supprime la source quand la pipeline lève une exception', async () => {
    const { repository, supabase, llm, remove } = buildMocks({
      generateStructured: async () => {
        throw new Error('boom réseau');
      },
    });
    const service = new GenerateImportDraftService(repository, supabase, llm);

    const result = await service.generate('job-1');

    expect(result).toMatchObject({
      success: false,
      error: 'Import interrompu: boom réseau',
    });
    expect(repository.markFailed).toHaveBeenCalledWith({
      id: 'job-1',
      error: 'Import interrompu: boom réseau',
      stepStates: initialStepStates(),
    });
    expect(remove).toHaveBeenCalledWith(['10/abc']);
  });

  it("remonte un échec quand l'enregistrement du brouillon échoue après un run payé", async () => {
    const { repository, supabase, llm } = buildMocks({
      markDone: async () => failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR),
    });
    const service = new GenerateImportDraftService(repository, supabase, llm);

    const result = await service.generate('job-1');

    expect(repository.markDone).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: 'Enregistrement du brouillon du job job-1 impossible',
    });
  });

  it("remonte un échec quand l'enregistrement de l'échec d'extraction échoue", async () => {
    const { repository, supabase, llm } = buildMocks({
      sourceContent: '',
      markFailed: async () => failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR),
    });
    const service = new GenerateImportDraftService(repository, supabase, llm);

    const result = await service.generate('job-1');

    expect(llm.generateStructured).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Enregistrement de l'échec du job job-1 impossible",
    });
  });
});
