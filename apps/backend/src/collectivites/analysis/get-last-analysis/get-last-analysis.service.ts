import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { AnalysisJobRepository } from '../analysis-job.repository';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from '../analysis-job.errors';
import { toAnalysisStatus } from './get-last-analysis.adapter';
import { type GetLastAnalysisInput } from './get-last-analysis.input';
import { type AnalysisStatus } from './get-last-analysis.output';

@Injectable()
export class GetLastAnalysisService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AnalysisJobRepository
  ) {}

  async getLastAnalysis(
    { collectiviteId, enjeu }: GetLastAnalysisInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<AnalysisStatus | null, AnalysisJobError>> {
    const permissionResult = await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['PLANS.FICHES.BULK_UPDATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(AnalysisJobErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    const progressResult = await this.jobRepository.getLastProgressOf({
      collectiviteId,
      enjeu,
    });
    if (!progressResult.success) {
      return progressResult;
    }

    const progress = progressResult.data;
    if (!progress) {
      return success(null);
    }

    return toAnalysisStatus(progress);
  }
}
