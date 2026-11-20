import { Injectable, Logger } from '@nestjs/common';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { EVENT_AI_PLAN_IMPORT_FAILED } from '../ai-plan-import.constants';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';

/**
 * Un import qui attend une réponse occupe sa collectivité. Au-delà de la
 * rétention du point de reprise, il échoue comme un autre : son plan passe en
 * échec et la collectivité peut relancer un import.
 */
@Injectable()
export class ExpireImportQuestionsService {
  private readonly logger = new Logger(ExpireImportQuestionsService.name);

  constructor(
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly planVerificationRepository: PlanVerificationRepository,
    private readonly trackingService: TrackingService
  ) {}

  async expire(): Promise<void> {
    const expired = await this.jobRepository.expireAwaitingAnswers();
    if (!expired.success) {
      this.logger.error(`Imports sans réponse non expirés (${expired.error})`);
      return;
    }
    for (const job of expired.data) {
      if (job.createdPlanId !== null) {
        const planFailed =
          await this.planVerificationRepository.markAsImportFailed(
            job.createdPlanId
          );
        if (!planFailed.success) {
          this.logger.error(
            `Import ${job.id}: plan ${job.createdPlanId} non passé en échec (${planFailed.error})`
          );
        }
      }
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
