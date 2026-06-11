import { Injectable } from '@nestjs/common';
import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { isClientError } from '@tet/backend/plans/plans/import-plan-aggregate/import.errors';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ResourceType } from '@tet/domain/users';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportJobStatusEnum } from '../models/ai-plan-import-job';
import { ConfirmError } from './confirm-import.errors';
import { ConfirmImportInput } from './confirm-import.input';
import { ConfirmImportOutput } from './confirm-import.output';
import {
  draftToImportPlanInput,
  draftValidationErrors,
} from './draft-to-import-plan-input';

@Injectable()
export class ConfirmImportService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly importPlanService: ImportPlanService,
    private readonly transactionManager: TransactionManager
  ) {}

  async confirm(args: {
    input: ConfirmImportInput;
    user: AuthenticatedUser;
  }): Promise<Result<ConfirmImportOutput, ConfirmError>> {
    const { input, user } = args;

    const jobResult = await this.jobRepository.getById(input.jobId);
    if (!jobResult.success) {
      return failure({ kind: 'job_not_found' });
    }
    const job = jobResult.data;

    const isAllowed = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      job.collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure({ kind: 'forbidden' });
    }

    const planInput = draftToImportPlanInput({
      actions: input.actions,
      planName: input.planName,
      planType: input.planType,
    });
    const fichesCount = planInput.actions.length;

    if (job.confirmedPlanId !== null) {
      return success({ planId: job.confirmedPlanId, fichesCount });
    }

    const lineErrors = draftValidationErrors(input.actions);
    if (lineErrors.length > 0) {
      return failure({ kind: 'invalid_lines', errors: lineErrors });
    }

    if (job.status !== AiPlanImportJobStatusEnum.DONE) {
      return failure({ kind: 'not_confirmable', status: job.status });
    }
    if (job.draft === null) {
      return failure({ kind: 'no_draft' });
    }

    return this.transactionManager.executeSingle<ConfirmImportOutput, ConfirmError>(
      async (tx) => {
        const claim = await this.jobRepository.claimForConfirm({ id: job.id, tx });
        if (!claim.success) {
          return failure({
            kind: 'persistence_failed',
            message: 'La réservation du job de confirmation a échoué',
            isClient: false,
          });
        }

        if (claim.data === null) {
          const reread = await this.jobRepository.getById(job.id);
          if (reread.success && reread.data.confirmedPlanId !== null) {
            return success({ planId: reread.data.confirmedPlanId, fichesCount });
          }
          return failure({
            kind: 'not_confirmable',
            status: reread.success ? reread.data.status : job.status,
          });
        }

        const saved = await this.importPlanService.save({
          planInput,
          collectiviteId: job.collectiviteId,
          user,
          tx,
        });
        if (!saved.success) {
          return failure({
            kind: 'persistence_failed',
            message: saved.error.message,
            isClient: isClientError(saved.error),
          });
        }

        const recorded = await this.jobRepository.recordConfirmedPlan({
          id: job.id,
          planId: saved.data.planId,
          tx,
        });
        if (!recorded.success) {
          return failure({
            kind: 'persistence_failed',
            message: "L'enregistrement du plan confirmé a échoué",
            isClient: false,
          });
        }

        return success({
          planId: saved.data.planId,
          fichesCount: saved.data.fichesCount,
        });
      }
    );
  }
}
