import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { AiPlanImportErrorEnum } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { GENERATE_IMPORT_DRAFT_JOB_NAME } from '../ai-plan-import.queue';
import { ExpireImportQuestionsService } from '../expire-import-questions/expire-import-questions.service';
import {
  AiPlanImportJob,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job';
import { isSupportedGenericImport } from '../models/import-checkpoint';
import { initialStepStates } from '../pipeline/run-import-pipeline';
import { AnswerImportQuestionService } from './answer-import-question.service';

const user = { id: 'membre-1' } as AuthenticatedUser;

const level = (exampleTitle: string, count: number) => ({
  exampleTitle,
  examplePage: 3,
  count,
});

const awaitingJob: AiPlanImportJob = {
  id: 'job-1',
  collectiviteId: 10,
  createdBy: 'user-1',
  status: AiPlanImportJobStatusEnum.AWAITING_ANSWER,
  options: {
    instructions: '',
    planName: 'PLPDMA',
    withVerifications: true,
    withSousActions: true,
    disabledFields: [],
  },
  stepStates: { ...initialStepStates(), reading: 'ok' },
  sourcePath: '10/abc',
  draft: null,
  error: null,
  createdPlanId: 42,
  fichierId: 7,
  startedAt: '2026-11-20T09:00:00Z',
  finishedAt: null,
  stats: null,
  question: {
    kind: 'action-level',
    axes: level('Limiter les déchets verts', 5),
    fiches: level('Accompagner les habitants', 16),
    etapes: level('Diagnostiquer et orienter', 54),
    proposed: 'fiche',
    answer: null,
  },
  attempt: 0,
  createdAt: '2026-11-20T09:00:00Z',
  modifiedAt: '2026-11-20T09:01:00Z',
};

const answer = { kind: 'action-level', actionLevel: 'etape' } as const;

const buildService = ({
  allowed = true,
  answered = success({
    ...awaitingJob,
    status: AiPlanImportJobStatusEnum.PENDING,
    attempt: 1,
  }),
  add = vi.fn(async () => ({ id: 'bull-job' })),
}: {
  allowed?: boolean;
  answered?: Awaited<ReturnType<AiPlanImportJobRepository['answerQuestion']>>;
  add?: ReturnType<typeof vi.fn>;
} = {}) => {
  const jobRepository = {
    isSupportedImport: isSupportedGenericImport,
    getById: vi.fn(async () => success(awaitingJob)),
    answerQuestion: vi.fn(async () => answered),
    reopenQuestion: vi.fn(async () => success(awaitingJob)),
  };
  const permissions = {
    isAllowed: vi.fn(async () =>
      allowed ? success(undefined) : failure('NOT_ALLOWED' as never)
    ),
  };
  const transactionManager = {
    executeSingle: vi.fn(async (operation) => operation({} as Transaction)),
  };
  const expire = vi.fn(async () => undefined);
  const queue = { add };
  const service = new AnswerImportQuestionService(
    permissions as unknown as PermissionService,
    jobRepository as unknown as AiPlanImportJobRepository,
    transactionManager as unknown as TransactionManager,
    { capture: vi.fn() } as unknown as TrackingService,
    { expire } as unknown as ExpireImportQuestionsService,
    queue as unknown as Queue
  );
  return { service, jobRepository, permissions, queue, expire };
};

describe('AnswerImportQuestionService', () => {
  it('enregistre la réponse et remet l’import en file sous un identifiant neuf', async () => {
    const { service, jobRepository, queue, permissions } = buildService();

    const result = await service.answer({ jobId: 'job-1', answer }, { user });

    expect(result).toEqual(success({ jobId: 'job-1' }));
    expect(permissions.isAllowed).toHaveBeenCalledWith(
      user,
      'plans.fiches.import',
      expect.anything(),
      { collectiviteId: 10 }
    );
    expect(jobRepository.answerQuestion).toHaveBeenCalledWith(
      { id: 'job-1', answer, answeredBy: 'membre-1' },
      expect.anything()
    );
    expect(queue.add).toHaveBeenCalledWith(
      GENERATE_IMPORT_DRAFT_JOB_NAME,
      { jobId: 'job-1', executionAttempt: 1 },
      { jobId: expect.stringMatching(/^job-1-reponse-/) }
    );
  });

  it('cache l’import d’une collectivité où l’on ne peut pas importer', async () => {
    const { service, jobRepository } = buildService({ allowed: false });

    const result = await service.answer({ jobId: 'job-1', answer }, { user });

    expect(result).toEqual(failure(AiPlanImportErrorEnum.JOB_NOT_FOUND));
    expect(jobRepository.answerQuestion).not.toHaveBeenCalled();
  });

  it('refuse une seconde réponse, et fait expirer les imports restés sans réponse', async () => {
    const { service, queue, expire } = buildService({
      answered: failure(AiPlanImportErrorEnum.IMPORT_NOT_AWAITING_ANSWER),
    });

    const result = await service.answer({ jobId: 'job-1', answer }, { user });

    expect(result).toEqual(
      failure(AiPlanImportErrorEnum.IMPORT_NOT_AWAITING_ANSWER)
    );
    expect(queue.add).not.toHaveBeenCalled();
    expect(expire).toHaveBeenCalled();
  });

  it('repose la question quand la file refuse le nouveau passage', async () => {
    const { service, jobRepository } = buildService({
      add: vi.fn(async () => {
        throw new Error('Redis indisponible');
      }),
    });

    const result = await service.answer({ jobId: 'job-1', answer }, { user });

    expect(result).toEqual(failure(AiPlanImportErrorEnum.CREATE_JOB_ERROR));
    expect(jobRepository.reopenQuestion).toHaveBeenCalledWith({
      id: 'job-1',
      attempt: 1,
    });
  });
});
