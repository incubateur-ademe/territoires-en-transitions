import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportJob } from '../models/ai-plan-import-job.table';
import type { GetImportStatusOutput } from './get-import-status.output';

export type GetImportStatusServiceInput = {
  jobId: string;
  user: AuthenticatedUser;
};

@Injectable()
export class GetImportStatusService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly repository: AiPlanImportJobRepository
  ) {}

  async getStatus(
    input: GetImportStatusServiceInput
  ): Promise<Result<GetImportStatusOutput, AiPlanImportError>> {
    const job = await this.repository.getById(input.jobId);
    if (!job.success) {
      return job;
    }

    const isAllowed = await this.permissions.isAllowed(
      input.user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      job.data.collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
    }

    return success(toOutput(job.data));
  }
}

const toOutput = (job: AiPlanImportJob): GetImportStatusOutput => ({
  jobId: job.id,
  status: job.status,
  stepStates: job.stepStates,
  draft: job.draft,
  error: job.error,
});
