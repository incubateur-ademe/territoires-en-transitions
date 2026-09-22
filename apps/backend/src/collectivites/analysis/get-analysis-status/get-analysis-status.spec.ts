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
import { GetAnalysisStatusService } from './get-analysis-status.service';

const jobId = '00000000-0000-0000-0000-000000000001';

const user: AuthenticatedUser = {
  id: 'a-user',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
} as AuthenticatedUser;

const progress = {
  id: jobId,
  collectiviteId: 7,
  enjeu: 'ges' as const,
  etape: 'classification' as const,
  status: AnalysisJobStatusEnum.RUNNING,
  processedBatches: 1,
  totalBatches: 3,
  report: null,
  error: null,
};

const toService = ({
  progressOutcome = success(progress) as Result<
    AnalysisProgress,
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
    getProgressById: vi.fn().mockResolvedValue(progressOutcome),
  };

  return new GetAnalysisStatusService(
    permissions as never,
    jobRepository as never
  );
};

describe('GetAnalysisStatusService.getStatus', () => {
  it('rend la progression du job a un membre de sa collectivite', async () => {
    const service = toService();

    const result = await service.getStatus({ jobId }, { user });

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        collectiviteId: 7,
        enjeu: 'ges',
        etape: 'classification',
        status: AnalysisJobStatusEnum.RUNNING,
        processedBatches: 1,
        totalBatches: 3,
      },
    });
  });

  it("presente le job comme introuvable a qui n'est pas membre, plutot qu'interdit", async () => {
    const service = toService({ isAllowed: false });

    const result = await service.getStatus({ jobId }, { user });

    expect(result).toEqual({
      success: false,
      error: AnalysisJobErrorEnum.JOB_NOT_FOUND,
    });
  });

  it('remonte telle quelle une lecture de job impossible', async () => {
    const service = toService({
      progressOutcome: failure(AnalysisJobErrorEnum.GET_JOB_ERROR),
    });

    const result = await service.getStatus({ jobId }, { user });

    expect(result).toEqual({
      success: false,
      error: AnalysisJobErrorEnum.GET_JOB_ERROR,
    });
  });
});
