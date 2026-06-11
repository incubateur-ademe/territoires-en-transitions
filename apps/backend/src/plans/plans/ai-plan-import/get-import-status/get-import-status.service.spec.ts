import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { AiPlanImportErrorEnum } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import {
  AiPlanImportJob,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job.table';
import { initialStepStates } from '../generate-import-draft/run-import-pipeline';
import { GetImportStatusService } from './get-import-status.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const toJob = (overrides: Partial<AiPlanImportJob>): AiPlanImportJob => ({
  id: 'job-1',
  collectiviteId: 10,
  createdBy: 'user-1',
  status: AiPlanImportJobStatusEnum.RUNNING,
  options: {
    instructions: '',
    withVerifications: true,
    withSousActions: true,
    disabledFields: [],
  },
  stepStates: initialStepStates(),
  sourcePath: '10/abc',
  draft: null,
  error: null,
  createdAt: '2026-06-10T00:00:00Z',
  modifiedAt: '2026-06-10T00:00:00Z',
  ...overrides,
});

const buildService = (args: {
  job: ReturnType<typeof toJob> | null;
  isAllowed: boolean;
}): GetImportStatusService => {
  const jobRepository = {
    getById: vi.fn(async () =>
      args.job
        ? success(args.job)
        : failure(AiPlanImportErrorEnum.JOB_NOT_FOUND)
    ),
  } as unknown as AiPlanImportJobRepository;
  const permissions = {
    isAllowed: vi.fn(async () => args.isAllowed),
  } as unknown as PermissionService;
  return new GetImportStatusService(permissions, jobRepository);
};

describe('GetImportStatusService', () => {
  it('expose le statut sans brouillon tant que le job tourne', async () => {
    const service = buildService({ job: toJob({}), isAllowed: true });

    const result = await service.getStatus({ jobId: 'job-1', user });

    expect(result).toMatchObject({
      success: true,
      data: { jobId: 'job-1', status: 'running', draft: null },
    });
  });

  it('expose le brouillon quand le job est terminé', async () => {
    const draft = { actions: [], qualitativeReview: 'Avis' };
    const service = buildService({
      job: toJob({ status: AiPlanImportJobStatusEnum.DONE, draft }),
      isAllowed: true,
    });

    const result = await service.getStatus({ jobId: 'job-1', user });

    expect(result).toMatchObject({ success: true, data: { draft } });
  });

  it('renvoie JOB_NOT_FOUND quand le job est introuvable', async () => {
    const service = buildService({ job: null, isAllowed: true });

    const result = await service.getStatus({ jobId: 'job-1', user });

    expect(result).toMatchObject({
      success: false,
      error: AiPlanImportErrorEnum.JOB_NOT_FOUND,
    });
  });

  it('renvoie JOB_NOT_FOUND sans droit (anti-énumération)', async () => {
    const service = buildService({ job: toJob({}), isAllowed: false });

    const result = await service.getStatus({ jobId: 'job-1', user });

    expect(result).toMatchObject({
      success: false,
      error: AiPlanImportErrorEnum.JOB_NOT_FOUND,
    });
  });
});
