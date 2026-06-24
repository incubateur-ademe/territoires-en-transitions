import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { AiPlanImportErrorEnum } from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import {
  AiPlanImportJobStatusEnum,
  AiPlanImportJobStatusView,
} from '../models/ai-plan-import-job';
import { initialStepStates } from '../generate-import-draft/run-import-pipeline';
import { GetImportStatusService } from './get-import-status.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const toView = (
  overrides: Partial<AiPlanImportJobStatusView>
): AiPlanImportJobStatusView => ({
  id: 'job-1',
  collectiviteId: 10,
  status: AiPlanImportJobStatusEnum.RUNNING,
  stepStates: initialStepStates(),
  error: null,
  createdPlanId: null,
  qualitativeReview: null,
  ...overrides,
});

const buildService = (args: {
  view?: AiPlanImportJobStatusView | null;
  inFlight?: AiPlanImportJobStatusView | null;
  isAllowed: boolean;
}): GetImportStatusService => {
  const jobRepository = {
    getStatusView: vi.fn(async () =>
      args.view
        ? success(args.view)
        : failure(AiPlanImportErrorEnum.JOB_NOT_FOUND)
    ),
    findInFlightByCollectivite: vi.fn(async () =>
      success(args.inFlight ?? null)
    ),
  } as unknown as AiPlanImportJobRepository;
  const permissions = {
    isAllowed: vi.fn(async () => args.isAllowed),
  } as unknown as PermissionService;
  return new GetImportStatusService(permissions, jobRepository);
};

describe('GetImportStatusService', () => {
  it('expose le statut sans avis tant que le job tourne', async () => {
    const service = buildService({ view: toView({}), isAllowed: true });

    const result = await service.getStatus({ jobId: 'job-1', user });

    expect(result).toMatchObject({
      success: true,
      data: { jobId: 'job-1', status: 'running', qualitativeReview: null },
    });
  });

  it('expose l avis qualitatif quand le job est terminé', async () => {
    const service = buildService({
      view: toView({
        status: AiPlanImportJobStatusEnum.DONE,
        qualitativeReview: 'Avis IA',
        createdPlanId: 42,
      }),
      isAllowed: true,
    });

    const result = await service.getStatus({ jobId: 'job-1', user });

    expect(result).toMatchObject({
      success: true,
      data: { qualitativeReview: 'Avis IA', createdPlanId: 42 },
    });
  });

  it('renvoie JOB_NOT_FOUND quand le job est introuvable', async () => {
    const service = buildService({ view: null, isAllowed: true });

    const result = await service.getStatus({ jobId: 'job-1', user });

    expect(result).toMatchObject({
      success: false,
      error: AiPlanImportErrorEnum.JOB_NOT_FOUND,
    });
  });

  it('renvoie JOB_NOT_FOUND sans droit (anti-énumération)', async () => {
    const service = buildService({ view: toView({}), isAllowed: false });

    const result = await service.getStatus({ jobId: 'job-1', user });

    expect(result).toMatchObject({
      success: false,
      error: AiPlanImportErrorEnum.JOB_NOT_FOUND,
    });
  });

  it('expose le job en cours de la collectivité', async () => {
    const service = buildService({
      inFlight: toView({ id: 'job-9', status: AiPlanImportJobStatusEnum.RUNNING }),
      isAllowed: true,
    });

    const result = await service.getCurrentImport({
      collectiviteId: 10,
      user,
    });

    expect(result).toMatchObject({
      success: true,
      data: { jobId: 'job-9', status: 'running' },
    });
  });

  it('renvoie null quand aucun job n est en cours', async () => {
    const service = buildService({ inFlight: null, isAllowed: true });

    const result = await service.getCurrentImport({
      collectiviteId: 10,
      user,
    });

    expect(result).toEqual({ success: true, data: null });
  });

  it('renvoie UNAUTHORIZED pour le job en cours sans droit', async () => {
    const service = buildService({ inFlight: toView({}), isAllowed: false });

    const result = await service.getCurrentImport({
      collectiviteId: 10,
      user,
    });

    expect(result).toMatchObject({
      success: false,
      error: AiPlanImportErrorEnum.UNAUTHORIZED,
    });
  });
});
