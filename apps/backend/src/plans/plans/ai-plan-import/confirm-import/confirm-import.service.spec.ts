import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { initialStepStates } from '../generate-import-draft/run-import-pipeline';
import {
  AiPlanImportJob,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job';
import { ExtractedAction } from '../models/extracted-action';
import { ConfirmImportService } from './confirm-import.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const toAction = (overrides: Partial<ExtractedAction> = {}): ExtractedAction => ({
  axe: 'Mobilité',
  sousAxe: 'Vélo',
  titre: 'Développer le réseau cyclable',
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: [],
  ...overrides,
});

const toJob = (overrides: Partial<AiPlanImportJob>): AiPlanImportJob => ({
  id: 'job-1',
  collectiviteId: 10,
  createdBy: 'user-1',
  status: AiPlanImportJobStatusEnum.DONE,
  options: {
    instructions: '',
    withVerifications: true,
    withSousActions: true,
    disabledFields: [],
  },
  stepStates: initialStepStates(),
  sourcePath: '10/abc',
  draft: { actions: [toAction()], qualitativeReview: null },
  error: null,
  confirmedPlanId: null,
  createdAt: '2026-06-10T00:00:00Z',
  modifiedAt: '2026-06-10T00:00:00Z',
  ...overrides,
});

const buildService = (args: {
  job: AiPlanImportJob | null;
  rereadJob?: AiPlanImportJob;
  isAllowed?: boolean;
  claimed?: boolean;
  savedPlanId?: number;
  savedFichesCount?: number;
}) => {
  const getById = vi.fn(async () =>
    args.job ? success(args.job) : failure('JOB_NOT_FOUND')
  );
  if (args.rereadJob) {
    getById.mockResolvedValueOnce(success(args.job ?? args.rereadJob));
    getById.mockResolvedValueOnce(success(args.rereadJob));
  }
  const claimForConfirm = vi.fn(async () =>
    success(args.claimed === false ? null : args.job)
  );
  const recordConfirmedPlan = vi.fn(async () => success(args.job));
  const save = vi.fn(async () =>
    success({
      planId: args.savedPlanId ?? 42,
      fichesCount: args.savedFichesCount ?? 1,
    })
  );
  const jobRepository = {
    getById,
    claimForConfirm,
    recordConfirmedPlan,
  } as unknown as AiPlanImportJobRepository;
  const importPlanService = { save } as unknown as ImportPlanService;
  const permissions = {
    isAllowed: vi.fn(async () => args.isAllowed ?? true),
  } as unknown as PermissionService;
  const transactionManager = {
    executeSingle: vi.fn(async (operation) => operation({} as Transaction)),
  } as unknown as TransactionManager;

  const service = new ConfirmImportService(
    permissions,
    jobRepository,
    importPlanService,
    transactionManager
  );
  return { service, save, claimForConfirm, recordConfirmedPlan };
};

describe('ConfirmImportService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mappe le brouillon édité, persiste via le seam et renvoie le plan créé', async () => {
    const { service, save } = buildService({
      job: toJob({}),
      savedPlanId: 42,
      savedFichesCount: 2,
    });

    const result = await service.confirm({
      input: {
        jobId: 'job-1',
        planName: 'Plan vélo 2026',
        actions: [toAction({ sousActions: [] }), toAction({ titre: 'Action 2' })],
      },
      user,
    });

    expect(result).toEqual({
      success: true,
      data: { planId: 42, fichesCount: 2 },
    });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        collectiviteId: 10,
        user,
        planInput: expect.objectContaining({
          nom: 'Plan vélo 2026',
          actions: expect.arrayContaining([
            expect.objectContaining({ titre: 'Développer le réseau cyclable' }),
          ]),
        }),
      })
    );
  });

  it('2e confirmation renvoie le même planId sans recréer de plan', async () => {
    const { service, save, claimForConfirm } = buildService({
      job: toJob({ confirmedPlanId: 42 }),
    });

    const result = await service.confirm({
      input: { jobId: 'job-1', planName: 'Plan vélo 2026', actions: [toAction()] },
      user,
    });

    expect(result).toEqual({
      success: true,
      data: { planId: 42, fichesCount: 1 },
    });
    expect(save).not.toHaveBeenCalled();
    expect(claimForConfirm).not.toHaveBeenCalled();
  });

  it('renvoie une erreur niveau champ par ligne quand le brouillon est invalide', async () => {
    const { service, save } = buildService({ job: toJob({}) });

    const result = await service.confirm({
      input: {
        jobId: 'job-1',
        planName: 'Plan vélo 2026',
        actions: [toAction({ titre: 'Valide' }), toAction({ titre: '' })],
      },
      user,
    });

    expect(result).toEqual({
      success: false,
      error: {
        kind: 'invalid_lines',
        errors: [
          {
            actionIndex: 1,
            titre: '',
            message: 'Le titre de l\'action est invalide : ""',
          },
        ],
      },
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('refuse la confirmation sans droit sur la collectivité', async () => {
    const { service } = buildService({ job: toJob({}), isAllowed: false });

    const result = await service.confirm({
      input: { jobId: 'job-1', planName: 'Plan vélo 2026', actions: [toAction()] },
      user,
    });

    expect(result).toEqual({ success: false, error: { kind: 'forbidden' } });
  });

  it('refuse la confirmation tant que le job n est pas terminé', async () => {
    const { service } = buildService({
      job: toJob({ status: AiPlanImportJobStatusEnum.RUNNING, draft: null }),
    });

    const result = await service.confirm({
      input: { jobId: 'job-1', planName: 'Plan vélo 2026', actions: [toAction()] },
      user,
    });

    expect(result).toEqual({
      success: false,
      error: { kind: 'not_confirmable', status: 'running' },
    });
  });

  it('renvoie le planId existant si la réservation échoue mais que le job est déjà confirmé', async () => {
    const { service, save } = buildService({
      job: toJob({}),
      rereadJob: toJob({ confirmedPlanId: 42 }),
      claimed: false,
    });

    const result = await service.confirm({
      input: { jobId: 'job-1', planName: 'Plan vélo 2026', actions: [toAction()] },
      user,
    });

    expect(result).toEqual({
      success: true,
      data: { planId: 42, fichesCount: 1 },
    });
    expect(save).not.toHaveBeenCalled();
  });
});
