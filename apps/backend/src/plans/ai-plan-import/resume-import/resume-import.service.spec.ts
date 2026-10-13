import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { AiPlanImportErrorEnum } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { GENERATE_IMPORT_DRAFT_JOB_NAME } from '../ai-plan-import.queue';
import {
  AiPlanImportJob,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job';
import { initialStepStates } from '../pipeline/run-import-pipeline';
import { ResumeImportService } from './resume-import.service';

const user = { id: 'super-admin' } as AuthenticatedUser;

const failedJob: AiPlanImportJob = {
  id: 'job-1',
  collectiviteId: 10,
  createdBy: 'user-1',
  status: AiPlanImportJobStatusEnum.FAILED,
  options: {
    instructions: '',
    planName: 'Plan importé',
    withVerifications: true,
    withSousActions: true,
    disabledFields: [],
  },
  stepStates: initialStepStates(),
  sourcePath: '10/abc',
  draft: null,
  error: 'Étape scoring en échec (api_error)',
  createdPlanId: 7,
  fichierId: 3,
  startedAt: null,
  finishedAt: null,
  stats: null,
  attempt: 0,
  createdAt: '2026-06-10T00:00:00Z',
  modifiedAt: '2026-06-10T00:00:00Z',
};

const buildService = ({
  allowed = true,
  job = failedJob,
  resumed = success({
    ...failedJob,
    status: AiPlanImportJobStatusEnum.PENDING,
    attempt: 1,
  }),
  add = vi.fn(async () => ({ id: 'bull-job' })),
}: {
  allowed?: boolean;
  job?: AiPlanImportJob;
  resumed?: Awaited<ReturnType<AiPlanImportJobRepository['resumeFailed']>>;
  add?: ReturnType<typeof vi.fn>;
} = {}) => {
  const jobRepository = {
    getById: vi.fn(async () => success(job)),
    resumeFailed: vi.fn(async () => resumed),
    markFailed: vi.fn(async () => success(job)),
    findResumableByPlan: vi.fn(async () => success({ jobId: 'job-1' })),
  };
  const planVerificationRepository = {
    markAsImporting: vi.fn(async () => success(undefined)),
    markAsImportFailed: vi.fn(async () => success(undefined)),
  };
  const permissions = {
    isAllowed: vi.fn(async () =>
      allowed ? success(undefined) : failure('NOT_ALLOWED' as never)
    ),
  };
  const transactionManager = {
    executeSingle: vi.fn(async (operation) => operation({} as Transaction)),
  };
  const queue = { add };
  const service = new ResumeImportService(
    permissions as unknown as PermissionService,
    jobRepository as unknown as AiPlanImportJobRepository,
    planVerificationRepository as unknown as PlanVerificationRepository,
    transactionManager as unknown as TransactionManager,
    queue as unknown as Queue
  );
  return {
    service,
    jobRepository,
    planVerificationRepository,
    permissions,
    queue,
  };
};

describe('ResumeImportService', () => {
  it('remet le job en file sous un identifiant BullMQ neuf et repasse son plan en import', async () => {
    const { service, queue, planVerificationRepository } = buildService();

    const result = await service.resume({ jobId: 'job-1' }, { user });

    expect(result).toEqual(success({ jobId: 'job-1' }));
    expect(planVerificationRepository.markAsImporting).toHaveBeenCalledWith(
      7,
      {}
    );
    expect(queue.add).toHaveBeenCalledWith(
      GENERATE_IMPORT_DRAFT_JOB_NAME,
      { jobId: 'job-1' },
      { jobId: expect.stringMatching(/^job-1-reprise-/) }
    );
  });

  it("refuse la reprise à qui n'est pas super admin", async () => {
    const { service, jobRepository, queue } = buildService({ allowed: false });

    const result = await service.resume({ jobId: 'job-1' }, { user });

    expect(result).toEqual(failure(AiPlanImportErrorEnum.UNAUTHORIZED));
    expect(jobRepository.resumeFailed).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("ne remet rien en file quand l'import n'est pas reprenable", async () => {
    const { service, queue } = buildService({
      resumed: failure(AiPlanImportErrorEnum.JOB_NOT_RESUMABLE),
    });

    const result = await service.resume({ jobId: 'job-1' }, { user });

    expect(result).toEqual(failure(AiPlanImportErrorEnum.JOB_NOT_RESUMABLE));
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('ne touche pas au plan quand il a été supprimé depuis l’échec', async () => {
    const { service, planVerificationRepository } = buildService({
      resumed: success({ ...failedJob, createdPlanId: null }),
    });

    await service.resume({ jobId: 'job-1' }, { user });

    expect(planVerificationRepository.markAsImporting).not.toHaveBeenCalled();
  });

  it("rétablit l'échec quand la remise en file échoue", async () => {
    const { service, jobRepository, planVerificationRepository } =
      buildService({
        add: vi.fn(async () => {
          throw new Error('redis indisponible');
        }),
      });

    const result = await service.resume({ jobId: 'job-1' }, { user });

    expect(result).toEqual(failure(AiPlanImportErrorEnum.CREATE_JOB_ERROR));
    expect(jobRepository.markFailed).toHaveBeenCalledWith({
      id: 'job-1',
      error: 'Étape scoring en échec (api_error)',
    });
    expect(planVerificationRepository.markAsImportFailed).toHaveBeenCalledWith(
      7
    );
  });

  it("ne cherche l'import reprenable d'un plan que pour le super admin", async () => {
    const allowed = buildService();
    const refused = buildService({ allowed: false });

    expect(
      await allowed.service.findResumable({ planId: 7 }, { user })
    ).toEqual(success({ jobId: 'job-1' }));
    expect(
      await refused.service.findResumable({ planId: 7 }, { user })
    ).toEqual(failure(AiPlanImportErrorEnum.UNAUTHORIZED));
    expect(refused.jobRepository.findResumableByPlan).not.toHaveBeenCalled();
  });
});
