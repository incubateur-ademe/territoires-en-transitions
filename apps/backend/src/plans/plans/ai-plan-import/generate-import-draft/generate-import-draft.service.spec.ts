import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
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

const buildMocks = (llmBehavior: () => Promise<never>) => {
  const repository = {
    getByIdRaw: vi.fn(async () => success(job)),
    transitionToRunning: vi.fn(async () => success(job)),
    markFailed: vi.fn(async () => success(job)),
    markDone: vi.fn(async () => success(job)),
  } as unknown as AiPlanImportJobRepository;

  const remove = vi.fn(async () => ({ error: null }));
  const supabase = {
    client: {
      storage: {
        from: () => ({
          download: async () => ({
            data: {
              arrayBuffer: async () =>
                Buffer.from('axe,titre\n1,Action', 'utf-8'),
              type: 'text/csv',
            },
            error: null,
          }),
          remove,
        }),
      },
    },
  } as unknown as SupabaseService;

  const llm = {
    generateStructured: vi.fn(llmBehavior),
  } as unknown as LlmService;

  return { repository, supabase, llm, remove };
};

describe('GenerateImportDraftService', () => {
  it('marque le job failed et supprime la source quand la pipeline lève une exception', async () => {
    const { repository, supabase, llm, remove } = buildMocks(async () => {
      throw new Error('boom réseau');
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
});
