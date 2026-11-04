import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportJobStatusView } from '../models/ai-plan-import-job';
import type { ListRecentImportsInput } from './get-import-status.input';
import type {
  GetImportStatusOutput,
  ListRecentImportsOutput,
} from './get-import-status.output';

export type GetImportStatusServiceInput = {
  jobId: string;
  user: AuthenticatedUser;
};

export type GetCurrentImportServiceInput = {
  collectiviteId: number;
  user: AuthenticatedUser;
};

@Injectable()
export class GetImportStatusService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AiPlanImportJobRepository
  ) {}

  async listRecentImports(
    input: ListRecentImportsInput,
    { user }: ServiceSecondArg
  ): Promise<Result<ListRecentImportsOutput, AiPlanImportError>> {
    const permissionResult = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(AiPlanImportErrorEnum.UNAUTHORIZED);
    }

    const result = await this.jobRepository.listRecentByCollectivite(input);
    if (!result.success) return result;

    return success({
      items: result.data.items.map(toOutput),
      nextCursor: result.data.nextCursor,
    });
  }

  async getStatus(
    input: GetImportStatusServiceInput
  ): Promise<Result<GetImportStatusOutput, AiPlanImportError>> {
    const view = await this.jobRepository.getStatusView(input.jobId);
    if (!view.success) {
      return view;
    }

    const permissionResult = await this.permissions.isAllowed(
      input.user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId: view.data.collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
    }

    return success(toOutput(view.data));
  }

  async getCurrentImport(
    input: GetCurrentImportServiceInput
  ): Promise<Result<GetImportStatusOutput | null, AiPlanImportError>> {
    const permissionResult = await this.permissions.isAllowed(
      input.user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(AiPlanImportErrorEnum.UNAUTHORIZED);
    }

    const inFlight = await this.jobRepository.findInFlightByCollectivite(
      input.collectiviteId
    );
    if (!inFlight.success) {
      return inFlight;
    }

    return success(inFlight.data === null ? null : toOutput(inFlight.data));
  }
}

const toOutput = (view: AiPlanImportJobStatusView): GetImportStatusOutput => ({
  jobId: view.id,
  planName: view.planName,
  profile: view.profile,
  createdAt: view.createdAt,
  finishedAt: view.finishedAt,
  status: view.status,
  stepStates: view.stepStates,
  qualitativeReview: view.qualitativeReview,
  error: view.error,
  createdPlanId: view.createdPlanId,
  resumable: view.resumable,
  withSecteurs: view.withSecteurs,
  report: {
    // L'erreur historique n'a pas de catégorie fiable : ne pas l'attribuer
    // au document, ni inventer les avertissements qui n'ont pas été conservés.
    issues:
      view.status === 'failed' && view.error !== null
        ? [
            {
              kind: 'processing-error',
              code: 'IMPORT_FAILED',
              message: view.error,
            },
          ]
        : [],
    qualitativeReview: view.qualitativeReview,
  },
});
