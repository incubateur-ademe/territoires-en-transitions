import { Injectable } from '@nestjs/common';
import { ImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.input';
import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { isClientError } from '@tet/backend/plans/plans/import-plan-aggregate/import.errors';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ResourceType } from '@tet/domain/users';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import {
  AiPlanImportJob,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job';
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

    return this.createPlanFromDraft({ job, planInput, fichesCount, user });
  }

  private createPlanFromDraft(args: {
    job: AiPlanImportJob;
    planInput: ImportPlanInput;
    fichesCount: number;
    user: AuthenticatedUser;
  }): Promise<Result<ConfirmImportOutput, ConfirmError>> {
    const { job, planInput, fichesCount, user } = args;

    return this.transactionManager.executeSingle<ConfirmImportOutput, ConfirmError>(
      async (tx) => {
        const lockResult = await this.jobRepository.lockForConfirm({
          id: job.id,
          tx,
        });
        if (!lockResult.success) {
          return failure({
            kind: 'persistence_failed',
            message: 'Le verrouillage du job de confirmation a échoué',
            isClient: false,
          });
        }
        const lockedJob = lockResult.data;
        if (lockedJob === null) {
          return failure({ kind: 'job_not_found' });
        }
        if (lockedJob.confirmedPlanId !== null) {
          return success({ planId: lockedJob.confirmedPlanId, fichesCount });
        }
        if (lockedJob.status !== AiPlanImportJobStatusEnum.DONE) {
          return failure({ kind: 'not_confirmable', status: lockedJob.status });
        }

        const saveResult = await this.importPlanService.save({
          planInput,
          collectiviteId: lockedJob.collectiviteId,
          user,
          tx,
        });
        if (!saveResult.success) {
          return failure({
            kind: 'persistence_failed',
            message: saveResult.error.message,
            isClient: isClientError(saveResult.error),
          });
        }

        const recordResult = await this.jobRepository.recordConfirmedPlan({
          id: lockedJob.id,
          planId: saveResult.data.planId,
          tx,
        });
        if (!recordResult.success) {
          return failure({
            kind: 'persistence_failed',
            message: "L'enregistrement du plan confirmé a échoué",
            isClient: false,
          });
        }

        return success({
          planId: saveResult.data.planId,
          fichesCount: saveResult.data.fichesCount,
        });
      }
    );
  }
}
