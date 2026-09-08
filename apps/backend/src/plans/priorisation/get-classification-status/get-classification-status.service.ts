import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { ClassificationLeviersJobRepository } from '../classification-leviers-job.repository';
import {
  ClassificationLeviersErrorEnum,
  type ClassificationLeviersError,
} from '../classification-leviers.errors';
import { toClassificationStatus } from './get-classification-status.adapter';
import { type ClassificationStatus } from './get-classification-status.output';

@Injectable()
export class GetClassificationStatusService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: ClassificationLeviersJobRepository
  ) {}

  async getStatus(
    { jobId }: { jobId: string },
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<ClassificationStatus, ClassificationLeviersError>> {
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
      return failure(ClassificationLeviersErrorEnum.JOB_NOT_FOUND);
    }

    return toClassificationStatus(job);
  }
}
