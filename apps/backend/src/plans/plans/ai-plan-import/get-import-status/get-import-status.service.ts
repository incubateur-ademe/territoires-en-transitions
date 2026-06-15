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
import { AiPlanImportJobStatusView } from '../models/ai-plan-import-job';
import type { GetImportStatusOutput } from './get-import-status.output';

export type GetImportStatusServiceInput = {
  jobId: string;
  user: AuthenticatedUser;
};

@Injectable()
export class GetImportStatusService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AiPlanImportJobRepository
  ) {}

  async getStatus(
    input: GetImportStatusServiceInput
  ): Promise<Result<GetImportStatusOutput, AiPlanImportError>> {
    const view = await this.jobRepository.getStatusView(input.jobId);
    if (!view.success) {
      return view;
    }

    const isAllowed = await this.permissions.isAllowed(
      input.user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      view.data.collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
    }

    return success(toOutput(view.data));
  }
}

const toOutput = (view: AiPlanImportJobStatusView): GetImportStatusOutput => ({
  jobId: view.id,
  status: view.status,
  stepStates: view.stepStates,
  qualitativeReview: view.qualitativeReview,
  error: view.error,
  createdPlanId: view.createdPlanId,
});
