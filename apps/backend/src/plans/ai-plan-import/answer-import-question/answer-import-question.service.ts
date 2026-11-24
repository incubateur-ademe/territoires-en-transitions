import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { EVENT_AI_PLAN_IMPORT_QUESTION_ANSWERED } from '../ai-plan-import.constants';
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
import { jobTrackingProperties } from '../generate-import-draft/import-job-tracking';
import { AiPlanImportJob } from '../models/ai-plan-import-job';
import { ExpireImportQuestionsService } from '../expire-import-questions/expire-import-questions.service';
import { AnswerImportQuestionInput } from './answer-import-question.input';

/**
 * La réponse à la précision demandée après la lecture : l'import reprend de
 * son point de reprise avec la lecture choisie, sans relire le document.
 */
@Injectable()
export class AnswerImportQuestionService {
  private readonly logger = new Logger(AnswerImportQuestionService.name);

  constructor(
    private readonly permissions: PermissionService,
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly transactionManager: TransactionManager,
    private readonly trackingService: TrackingService,
    private readonly expireImportQuestions: ExpireImportQuestionsService,
    @InjectQueue(AI_PLAN_IMPORT_QUEUE_NAME)
    private readonly queue: Queue<AiPlanImportJobData>
  ) {}

  async answer(
    { jobId, answer }: AnswerImportQuestionInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<{ jobId: string }, AiPlanImportError>> {
    const job = await this.jobRepository.getById(jobId);
    if (!job.success) {
      return job;
    }
    // Comme le suivi : un import d'une autre collectivité n'existe pas.
    const allowed = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId: job.data.collectiviteId }
    );
    if (!allowed.success) {
      return failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
    }
    if (!this.jobRepository.isSupportedImport(job.data.options)) {
      return failure(AiPlanImportErrorEnum.UNSUPPORTED_IMPORT_CONTRACT);
    }

    const answered = await this.transactionManager.executeSingle<
      AiPlanImportJob,
      AiPlanImportError
    >((tx) =>
      this.jobRepository.answerQuestion(
        { id: jobId, answer, answeredBy: user.id },
        tx
      )
    );
    if (!answered.success) {
      // Le délai est peut-être passé : l'import échoue et libère la collectivité.
      if (answered.error === AiPlanImportErrorEnum.IMPORT_NOT_AWAITING_ANSWER) {
        await this.expireImportQuestions.expire();
      }
      return answered;
    }

    try {
      // L'identifiant du premier passage reste un temps dans BullMQ : il serait ignoré.
      await this.queue.add(
        GENERATE_IMPORT_DRAFT_JOB_NAME,
        { jobId, executionAttempt: answered.data.attempt },
        { jobId: `${jobId}-reponse-${randomUUID()}` }
      );
    } catch (error) {
      this.logger.error(
        `Remise en file de l'import ${jobId}: ${getErrorMessage(error)}`
      );
      const reopened = await this.jobRepository.reopenQuestion({
        id: jobId,
        attempt: answered.data.attempt,
      });
      if (!reopened.success) {
        // Comme pour la reprise : sans message en file, ce job `pending` bloque
        // sa collectivité jusqu'à une intervention manuelle.
        this.logger.error(
          `Import ${jobId} resté en attente sans message en file : question non rouverte (${reopened.error})`
        );
      }
      return failure(AiPlanImportErrorEnum.CREATE_JOB_ERROR);
    }

    this.trackingService.capture({
      distinctId: user.id,
      event: EVENT_AI_PLAN_IMPORT_QUESTION_ANSWERED,
      properties: {
        ...jobTrackingProperties(job.data),
        actionLevel: answer.actionLevel,
        proposed: job.data.question?.proposed,
      },
      groups: { collectivite: String(job.data.collectiviteId) },
    });
    return success({ jobId });
  }
}
