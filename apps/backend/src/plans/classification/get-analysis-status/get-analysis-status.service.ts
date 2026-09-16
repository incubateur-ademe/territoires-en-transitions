import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { ClassificationVoletsJobRepository } from '../classification-volets-job.repository';
import {
  ClassificationVoletsErrorEnum,
  type ClassificationVoletsError,
} from '../classification-volets.errors';
import { toAnalysisStatus } from './get-analysis-status.adapter';
import { type AnalysisStatus } from './get-analysis-status.output';

@Injectable()
export class GetAnalysisStatusService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: ClassificationVoletsJobRepository
  ) {}

  async getStatus(
    { jobId }: { jobId: string },
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<AnalysisStatus, ClassificationVoletsError>> {
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
      return failure(ClassificationVoletsErrorEnum.JOB_NOT_FOUND);
    }

    return toAnalysisStatus(job);
  }
}
