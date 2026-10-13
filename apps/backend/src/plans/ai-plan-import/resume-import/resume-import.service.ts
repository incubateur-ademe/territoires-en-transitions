import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import {
  AI_PLAN_IMPORT_QUEUE_NAME,
  GENERATE_IMPORT_DRAFT_JOB_NAME,
  type AiPlanImportJobData,
} from '../ai-plan-import.queue';
import { AiPlanImportJob } from '../models/ai-plan-import-job';
import {
  FindResumableImportInput,
  ResumeImportInput,
} from './resume-import.input';

/**
 * Reprise par l'équipe d'un import en échec, depuis sa dernière étape
 * terminée : ce qui est fait ne rappelle pas le modèle.
 */
@Injectable()
export class ResumeImportService {
  private readonly logger = new Logger(ResumeImportService.name);

  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly planVerificationRepository: PlanVerificationRepository,
    private readonly transactionManager: TransactionManager,
    @InjectQueue(AI_PLAN_IMPORT_QUEUE_NAME)
    private readonly queue: Queue<AiPlanImportJobData>
  ) {}

  /** Pour la page d'un plan en échec : l'import qui peut le reprendre. */
  async findResumable(
    { planId }: FindResumableImportInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<{ jobId: string } | null, AiPlanImportError>> {
    if (!(await this.canResume(user))) {
      return failure(AiPlanImportErrorEnum.UNAUTHORIZED);
    }
    return this.jobRepository.findResumableByPlan(planId);
  }

  async resume(
    { jobId }: ResumeImportInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<{ jobId: string }, AiPlanImportError>> {
    if (!(await this.canResume(user))) {
      return failure(AiPlanImportErrorEnum.UNAUTHORIZED);
    }

    const failed = await this.jobRepository.getById(jobId);
    if (!failed.success) {
      return failed;
    }

    const resumed = await this.transactionManager.executeSingle<
      AiPlanImportJob,
      AiPlanImportError
    >(async (tx) => {
      const job = await this.jobRepository.resumeFailed(jobId, tx);
      if (!job.success || job.data.createdPlanId === null) {
        // Plan supprimé depuis l'échec : la persistance en recrée un.
        return job;
      }
      const importing = await this.planVerificationRepository.markAsImporting(
        job.data.createdPlanId,
        tx
      );
      return importing.success
        ? job
        : failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR);
    });
    if (!resumed.success) {
      return resumed;
    }

    try {
      // BullMQ garde le job en échec 24 h : le même identifiant serait ignoré.
      await this.queue.add(
        GENERATE_IMPORT_DRAFT_JOB_NAME,
        { jobId },
        { jobId: `${jobId}-reprise-${randomUUID()}` }
      );
    } catch (error) {
      this.logger.error(
        `Remise en file de l'import ${jobId}: ${getErrorMessage(error)}`
      );
      await this.restoreFailure(failed.data);
      return failure(AiPlanImportErrorEnum.CREATE_JOB_ERROR);
    }

    this.logger.log(`Import ${jobId} repris par ${user.id}`);
    return success({ jobId });
  }

  private async canResume(user: AuthenticatedUser): Promise<boolean> {
    const allowed = await this.permissions.isAllowed(
      user,
      'plans.fiches.import_resume',
      ResourceType.PLATEFORME,
      null
    );
    return allowed.success;
  }

  private async restoreFailure(job: AiPlanImportJob): Promise<void> {
    await this.jobRepository.markFailed({
      id: job.id,
      error: job.error ?? 'Reprise impossible',
    });
    if (job.createdPlanId !== null) {
      await this.planVerificationRepository.markAsImportFailed(
        job.createdPlanId
      );
    }
  }
}
