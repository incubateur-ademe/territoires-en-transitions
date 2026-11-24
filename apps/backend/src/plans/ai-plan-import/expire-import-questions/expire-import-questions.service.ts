import { Injectable, Logger } from '@nestjs/common';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { VerifyPlanErrorEnum } from '@tet/backend/plans/plans/verify-plan/verify-plan.errors';
import { failure } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  AI_PLAN_IMPORT_SOURCE_BUCKET,
  EVENT_AI_PLAN_IMPORT_FAILED,
} from '../ai-plan-import.constants';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';

type ExpiredImport = {
  id: string;
  collectiviteId: number;
  createdBy: string;
  createdPlanId: number | null;
  sourcePath: string;
};

/**
 * Un import qui attend une réponse occupe sa collectivité. Au-delà de la
 * rétention du point de reprise, il échoue comme un autre : son plan passe en
 * échec, sa source part et la collectivité peut relancer un import.
 */
@Injectable()
export class ExpireImportQuestionsService {
  private readonly logger = new Logger(ExpireImportQuestionsService.name);

  constructor(
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly planVerificationRepository: PlanVerificationRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly transactionManager: TransactionManager,
    private readonly trackingService: TrackingService
  ) {}

  async expire(): Promise<void> {
    // Le job et son plan échouent ensemble : un plan resté en import ne
    // serait plus jamais repris, son job n'attendant plus de réponse.
    const expired = await this.transactionManager.executeSingle<
      ExpiredImport[],
      AiPlanImportError
    >(async (tx) => {
      const jobs = await this.jobRepository.expireAwaitingAnswers(tx);
      if (!jobs.success) return jobs;
      for (const job of jobs.data) {
        if (job.createdPlanId === null) continue;
        const planFailed =
          await this.planVerificationRepository.markAsImportFailed(
            job.createdPlanId,
            tx
          );
        // Un plan qui n'est plus en import n'a rien à passer en échec.
        if (
          !planFailed.success &&
          planFailed.error !== VerifyPlanErrorEnum.PLAN_NOT_FOUND
        ) {
          return failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR);
        }
      }
      return jobs;
    });
    if (!expired.success) {
      this.logger.error(`Imports sans réponse non expirés (${expired.error})`);
      return;
    }
    for (const job of expired.data) {
      await this.documentStorage.removeDocument({
        bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
        key: job.sourcePath,
      });
      this.trackingService.capture({
        distinctId: job.createdBy,
        event: EVENT_AI_PLAN_IMPORT_FAILED,
        properties: {
          collectiviteId: job.collectiviteId,
          jobId: job.id,
          reason: 'question_expired',
        },
        groups: { collectivite: String(job.collectiviteId) },
      });
    }
  }
}
