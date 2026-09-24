import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { type AnalysisProgress } from '../analysis-job.repository';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from '../analysis-job.errors';
import { AnalysisJobStatusEnum } from '../models/analysis-job';
import { GetLastAnalysisService } from './get-last-analysis.service';

const jobId = '00000000-0000-0000-0000-000000000001';
const collectiviteId = 7;
const createdAt = '2026-09-22T08:00:00.000Z';
const modifiedAt = '2026-09-22T08:05:00.000Z';

const user: AuthenticatedUser = {
  id: 'a-user',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
} as AuthenticatedUser;

const progress: AnalysisProgress = {
  id: jobId,
  collectiviteId,
  enjeu: 'ges',
  etape: 'classification',
  status: AnalysisJobStatusEnum.RUNNING,
  processedBatches: 1,
  totalBatches: 3,
  report: null,
  error: null,
  createdAt,
  modifiedAt,
};

const toService = ({
  progressOutcome = success(progress) as Result<
    AnalysisProgress | undefined,
    AnalysisJobError
  >,
  isAllowed = true,
} = {}) => {
  const permissions = {
    isAllowed: vi
      .fn()
      .mockResolvedValue(
        isAllowed ? success(undefined) : failure('UNAUTHORIZED')
      ),
  };
  const jobRepository = {
    getLastProgressOf: vi.fn().mockResolvedValue(progressOutcome),
  };

  return {
    service: new GetLastAnalysisService(
      permissions as never,
      jobRepository as never
    ),
    jobRepository,
  };
};

describe('GetLastAnalysisService.getLastAnalysis', () => {
  it('rend la derniere analyse a un membre de la collectivite', async () => {
    const { service } = toService();

    const result = await service.getLastAnalysis(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        collectiviteId,
        enjeu: 'ges',
        etape: 'classification',
        status: AnalysisJobStatusEnum.RUNNING,
        processedBatches: 1,
        totalBatches: 3,
        createdAt,
        modifiedAt,
      },
    });
  });

  it("rend null, sans erreur, quand la collectivite n'a jamais ete analysee", async () => {
    const { service } = toService({
      progressOutcome: success(undefined),
    });

    const result = await service.getLastAnalysis(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({ success: true, data: null });
  });

  it("presente la collectivite comme introuvable a qui n'en est pas membre, sans la lire", async () => {
    const { service, jobRepository } = toService({ isAllowed: false });

    const result = await service.getLastAnalysis(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect({
      result,
      repositoryCalls: jobRepository.getLastProgressOf.mock.calls.length,
    }).toEqual({
      result: {
        success: false,
        error: AnalysisJobErrorEnum.COLLECTIVITE_NOT_FOUND,
      },
      repositoryCalls: 0,
    });
  });

  it('remonte telle quelle une lecture impossible', async () => {
    const { service } = toService({
      progressOutcome: failure(AnalysisJobErrorEnum.GET_JOB_ERROR),
    });

    const result = await service.getLastAnalysis(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: false,
      error: AnalysisJobErrorEnum.GET_JOB_ERROR,
    });
  });
});
