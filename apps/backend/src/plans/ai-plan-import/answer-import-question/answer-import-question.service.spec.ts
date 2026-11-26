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
    doubts: [
      {
        kind: 'action-level',
        axes: level('Limiter les déchets verts', 5),
        fiches: level('Accompagner les habitants', 16),
        fichesWithEtapes: 16,
        etapes: level('Diagnostiquer et orienter', 54),
        proposed: 'fiche',
      },
    ],
    answer: null,
  },
  attempt: 0,
  createdAt: '2026-11-20T09:00:00Z',
  modifiedAt: '2026-11-20T09:01:00Z',
};

const choices = [{ kind: 'action-level', actionLevel: 'etape' }] as const;
const answer = { jobId: 'job-1', choices: [...choices] };

const buildService = ({
  allowed = true,
  answered = success({
    ...awaitingJob,
    status: AiPlanImportJobStatusEnum.PENDING,
    attempt: 1,
  }),
  add = vi.fn(async () => ({ id: 'bull-job' })),
  job = awaitingJob,
}: {
  allowed?: boolean;
  answered?: Awaited<ReturnType<AiPlanImportJobRepository['answerQuestion']>>;
  add?: ReturnType<typeof vi.fn>;
  job?: AiPlanImportJob;
} = {}) => {
  const jobRepository = {
    isSupportedImport: isSupportedGenericImport,
    getById: vi.fn(async () => success(job)),
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
  const tracking = { capture: vi.fn() };
  const service = new AnswerImportQuestionService(
    permissions as unknown as PermissionService,
    jobRepository as unknown as AiPlanImportJobRepository,
    transactionManager as unknown as TransactionManager,
    tracking as unknown as TrackingService,
    { expire } as unknown as ExpireImportQuestionsService,
    queue as unknown as Queue
  );
  return { service, jobRepository, permissions, queue, expire, tracking };
};

describe('AnswerImportQuestionService', () => {
  it('enregistre la réponse et remet l’import en file sous un identifiant neuf', async () => {
    const { service, jobRepository, queue, permissions } = buildService();

    const result = await service.answer(answer, { user });

    expect(result).toEqual(success({ jobId: 'job-1' }));
    expect(permissions.isAllowed).toHaveBeenCalledWith(
      user,
      'plans.fiches.import',
      expect.anything(),
      { collectiviteId: 10 }
    );
    expect(jobRepository.answerQuestion).toHaveBeenCalledWith(
      { id: 'job-1', choices, answeredBy: 'membre-1' },
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

    const result = await service.answer(answer, { user });

    expect(result).toEqual(failure(AiPlanImportErrorEnum.JOB_NOT_FOUND));
    expect(jobRepository.answerQuestion).not.toHaveBeenCalled();
  });

  it('refuse une seconde réponse, et fait expirer les imports restés sans réponse', async () => {
    const { service, queue, expire } = buildService({
      answered: failure(AiPlanImportErrorEnum.IMPORT_NOT_AWAITING_ANSWER),
    });

    const result = await service.answer(answer, { user });

    expect(result).toEqual(
      failure(AiPlanImportErrorEnum.IMPORT_NOT_AWAITING_ANSWER)
    );
    expect(queue.add).not.toHaveBeenCalled();
    expect(expire).toHaveBeenCalled();
  });

  it('refuse une réponse qui ne tranche pas exactement les doutes posés, sans rien faire expirer', async () => {
    const { service, queue, expire, tracking } = buildService({
      answered: failure(AiPlanImportErrorEnum.ANSWER_MISMATCH),
    });

    const result = await service.answer(answer, { user });

    expect(result).toEqual(failure(AiPlanImportErrorEnum.ANSWER_MISMATCH));
    expect(queue.add).not.toHaveBeenCalled();
    expect(expire).not.toHaveBeenCalled();
    expect(tracking.capture).not.toHaveBeenCalled();
  });

  it.each([
    ['la forme actuelle', awaitingJob],
    [
      'l’ancienne forme, à un seul doute',
      {
        ...awaitingJob,
        question: {
          kind: 'action-level',
          axes: level('Limiter les déchets verts', 5),
          fiches: level('Accompagner les habitants', 16),
          fichesWithEtapes: 16,
          etapes: level('Diagnostiquer et orienter', 54),
          proposed: 'fiche',
          answer: null,
        },
      } satisfies AiPlanImportJob,
    ],
  ])(
    'suit les sortes posées et celles changées, question sous %s',
    async (_forme, job) => {
      const { service, tracking } = buildService({ job });

      await service.answer(answer, { user });

      expect(tracking.capture).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            questionKinds: ['action-level'],
            questionCount: 1,
            changedKinds: ['action-level'],
            actionLevel: 'etape',
            proposed: 'fiche',
          }),
        })
      );
    }
  );

  it('repose la question quand la file refuse le nouveau passage', async () => {
    const { service, jobRepository } = buildService({
      add: vi.fn(async () => {
        throw new Error('Redis indisponible');
      }),
    });

    const result = await service.answer(answer, { user });

    expect(result).toEqual(failure(AiPlanImportErrorEnum.CREATE_JOB_ERROR));
    expect(jobRepository.reopenQuestion).toHaveBeenCalledWith({
      id: 'job-1',
      attempt: 1,
    });
  });
});
