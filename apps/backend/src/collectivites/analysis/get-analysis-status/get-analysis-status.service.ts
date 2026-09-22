import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { AnalysisJobRepository } from '../analysis-job.repository';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from '../analysis-job.errors';
import { toAnalysisStatus } from './get-analysis-status.adapter';
import { type GetAnalysisStatusInput } from './get-analysis-status.input';
import { type AnalysisStatus } from './get-analysis-status.output';

@Injectable()
export class GetAnalysisStatusService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AnalysisJobRepository
  ) {}

  async getStatus(
    { jobId }: GetAnalysisStatusInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<AnalysisStatus, AnalysisJobError>> {
    const jobResult = await this.jobRepository.getProgressById(jobId);
    if (!jobResult.success) {
      return jobResult;
    }
    const job = jobResult.data;

    const permissionResult = await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['PLANS.FICHES.BULK_UPDATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: job.collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(AnalysisJobErrorEnum.JOB_NOT_FOUND);
    }

    return toAnalysisStatus(job);
  }
}
