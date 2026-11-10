import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import {
  AI_PLAN_IMPORT_SOURCE_BUCKET,
  EVENT_AI_PLAN_IMPORT_FAILED,
  EVENT_AI_PLAN_IMPORT_RESUMED,
  EVENT_AI_PLAN_IMPORT_STEP_DONE,
  EVENT_AI_PLAN_IMPORT_SUCCEEDED,
} from '../ai-plan-import.constants';
import {
  AiPlanImportErrorEnum,
  aiPlanImportErrorMessages,
  aiPlanImportJobErrorMessages,
  type AiPlanImportError,
} from '../ai-plan-import.errors';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AiPlanImportStepRunRepository } from '../ai-plan-import-step-run.repository';
import { sumLlmCallMetrics } from '../pipeline/compute-import-metrics';
import { ImportJobTelemetry } from './import-job-telemetry';
import {
  jobTrackingProperties,
  statsTrackingProperties,
  stepRunTrackingProperties,
} from './import-job-tracking';
import { AiPlanImportJob } from '../models/ai-plan-import-job';
import { StoredImportCheckpoint } from '../models/import-checkpoint';
import { AiPlanImportProfileEnum } from '../models/import-profile';
import { GenerateElectrificationImportService } from '../electrification/generate-import/generate-electrification-import.service';
import { GenerateGenericImportService } from './generate-generic-import.service';
import {
  GeneratedImport,
  ImportFailureOptions,
  ImportGenerator,
} from './generate-import.types';
import { NotifyPlanImportedService } from '../notify-plan-imported/notify-plan-imported.service';
import { ImportGenerationErrors } from './generate-import.errors';

export type GenerateImportDraftError =
  | { kind: 'transition_failed'; jobId: string; cause: AiPlanImportError }
  | { kind: 'failure_record_failed'; jobId: string; cause: AiPlanImportError }
  | { kind: 'interrupted'; jobId: string; message: string };

@Injectable()
export class GenerateImportDraftService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GenerateImportDraftService.name);

  constructor(
    private readonly jobRepository: AiPlanImportJobRepository,
    private readonly documentStorage: DocumentStorageService,
    private readonly llm: LlmService,
    private readonly importPlanService: ImportPlanService,
    private readonly planVerificationRepository: PlanVerificationRepository,
    private readonly notifyPlanImportedService: NotifyPlanImportedService,
    private readonly trackingService: TrackingService,
    private readonly stepRunRepository: AiPlanImportStepRunRepository,
    private readonly generic: GenerateGenericImportService,
    private readonly electrification: GenerateElectrificationImportService
  ) {}

  /** Sans tâche planifiée, chaque démarrage purge les points de reprise expirés. */
  async onApplicationBootstrap(): Promise<void> {
    await this.jobRepository.purgeFailedCheckpoints();
  }

  async generate(
    jobId: string,
    onStarted?: (attempt: number) => Promise<void>
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const running = await this.jobRepository.transitionToRunning(jobId);
    if (!running.success) {
      return failure({
        kind: 'transition_failed',
        jobId,
        cause: running.error,
      });
    }
    const job = running.data;
    if (job.attempt > 0) {
      this.trackingService.capture({
        distinctId: job.createdBy,
        event: EVENT_AI_PLAN_IMPORT_RESUMED,
        properties: jobTrackingProperties(job),
        groups: { collectivite: String(job.collectiviteId) },
      });
    }
    try {
      await onStarted?.(job.attempt);
    } catch {
      return this.recordFailure(
        jobId,
        aiPlanImportJobErrorMessages.WORKER_ATTEMPT_UNRECORDED,
        'worker_attempt_unrecorded',
        { attempt: job.attempt }
      );
    }

    if (!this.jobRepository.isSupportedImport(job.options)) {
      // Un autre déploiement peut savoir le traiter : ni repli générique,
      // ni destruction de sa source ou de son point de reprise.
      return this.recordFailure(
        jobId,
        aiPlanImportErrorMessages.UNSUPPORTED_IMPORT_CONTRACT,
        'unsupported_import_contract',
        { attempt: job.attempt }
      );
    }
    const checkpoint = await this.jobRepository.getCheckpoint(
      job.id,
      job.options.profile
    );
    if (
      !checkpoint.success &&
      checkpoint.error === AiPlanImportErrorEnum.INVALID_CHECKPOINT
    ) {
      return this.recordFailure(
        jobId,
        aiPlanImportErrorMessages.INVALID_CHECKPOINT,
        'checkpoint_unsupported',
        { attempt: job.attempt }
      );
    }

    try {
      return await this.runProfile(job, checkpoint);
    } catch (error) {
      const message = ImportGenerationErrors.interrupted(error);
      await this.markFailed(jobId, message, 'interrupted', {
        attempt: job.attempt,
      });
      return failure({ kind: 'interrupted', jobId, message });
    } finally {
      await this.removeSourceForAttempt(job);
    }
  }

  async recordTerminalFailure(
    jobId: string,
    message: string,
    attempt = 0
  ): Promise<void> {
    const job = await this.markFailed(jobId, message, 'terminal_failure', {
      attempt,
    });
    if (job.success && this.jobRepository.isSupportedImport(job.data.options)) {
      const checkpoint = await this.jobRepository.getCheckpoint(
        jobId,
        job.data.options.profile
      );
      if (!checkpoint.success) return;
      await this.removeSourceForAttempt(job.data);
    }
  }

  private async removeSourceForAttempt(job: AiPlanImportJob): Promise<void> {
    const current = await this.jobRepository.getById(job.id);
    if (!current.success || current.data.attempt !== job.attempt) return;
    await this.documentStorage.removeDocument({
      bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
      key: job.sourcePath,
    });
  }

  private async runProfile(
    job: AiPlanImportJob,
    checkpoint: Result<StoredImportCheckpoint | null, AiPlanImportError>
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    if (!checkpoint.success) {
      return this.recordFailure(
        job.id,
        aiPlanImportJobErrorMessages.CHECKPOINT_UNREADABLE,
        'checkpoint_unreadable',
        { attempt: job.attempt }
      );
    }
    const telemetry = await this.buildTelemetry(job);
    const generator: ImportGenerator =
      job.options.profile === AiPlanImportProfileEnum.ELECTRIFICATION
        ? this.electrification
        : this.generic;
    const imported = await generator.generate(job, checkpoint.data, telemetry);
    if (!imported.success) {
      const { message, reason, ...options } = imported.error;
      return this.recordFailure(job.id, message, reason, {
        ...options,
        attempt: job.attempt,
      });
    }
    await this.afterCommit(job, imported.data);
    return success(undefined);
  }

  /**
   * `reason` part dans PostHog : un code stable, jamais le message, qui peut
   * citer le document importé (« Ce document semble être … (« extrait ») »).
   */
  private async markFailed(
    jobId: string,
    message: string,
    reason: string,
    {
      attempt,
      draft,
      stepStates,
      failedStep,
      stats,
      dropCheckpoint,
      report,
    }: ImportFailureOptions = {}
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    const marked = await this.jobRepository.markFailed({
      id: jobId,
      attempt,
      error: message,
      stepStates,
      draft,
      stats,
      dropCheckpoint,
      report,
    });
    if (marked.success) {
      if (marked.data.createdPlanId !== null) {
        // Le plan reste visible en échec : la collectivité le supprime.
        const planFailed =
          await this.planVerificationRepository.markAsImportFailed(
            marked.data.createdPlanId
          );
        if (!planFailed.success) {
          this.logger.error(
            `Import ${jobId}: plan ${marked.data.createdPlanId} non passé en échec (${planFailed.error})`
          );
        }
      }
      this.trackingService.capture({
        distinctId: marked.data.createdBy,
        event: EVENT_AI_PLAN_IMPORT_FAILED,
        properties: {
          ...jobTrackingProperties(marked.data),
          ...statsTrackingProperties(stats),
          collectiviteId: marked.data.collectiviteId,
          jobId,
          failedStep,
          reason,
          issueKinds: report
            ? [...new Set(report.issues.map((issue) => issue.kind))].join(',')
            : undefined,
          durationSeconds: secondsSince(marked.data.createdAt),
          llmCalls: stats?.llm.calls,
          totalTokens: stats?.llm.tokens.totalTokens,
          models: stats?.llm.models.join(','),
        },
        groups: { collectivite: String(marked.data.collectiviteId) },
      });
    }
    return marked;
  }

  /** Les passages précédents d'un import repris comptent dans son résumé. */
  private async buildTelemetry(
    job: AiPlanImportJob
  ): Promise<ImportJobTelemetry> {
    const previousLlm =
      job.attempt > 0
        ? await this.stepRunRepository.sumPreviousLlmCalls(job.id, job.attempt)
        : null;
    if (previousLlm && !previousLlm.success) {
      this.logger.warn(
        `Import ${job.id}: appels des passages précédents illisibles (${previousLlm.error})`
      );
    }
    return new ImportJobTelemetry(
      job.id,
      this.llm.capabilities.strategy,
      this.stepRunRepository,
      this.logger,
      {
        attempt: job.attempt,
        previousLlm: previousLlm?.success
          ? previousLlm.data
          : sumLlmCallMetrics([]),
      },
      (run) =>
        this.trackingService.capture({
          distinctId: job.createdBy,
          event: EVENT_AI_PLAN_IMPORT_STEP_DONE,
          properties: {
            ...jobTrackingProperties(job),
            ...stepRunTrackingProperties(run),
          },
          groups: { collectivite: String(job.collectiviteId) },
        })
    );
  }

  private async afterCommit(
    job: AiPlanImportJob,
    created: GeneratedImport
  ): Promise<void> {
    const { recap, stats } = created;
    this.trackingService.capture({
      distinctId: job.createdBy,
      event: EVENT_AI_PLAN_IMPORT_SUCCEEDED,
      properties: {
        ...jobTrackingProperties(job),
        ...statsTrackingProperties(stats),
        collectiviteId: job.collectiviteId,
        jobId: job.id,
        planId: created.planId,
        ...recap,
        durationSeconds: secondsSince(job.createdAt),
        processingSeconds: job.startedAt
          ? secondsSince(job.startedAt)
          : undefined,
        llmCalls: stats.llm.calls,
        totalTokens: stats.llm.tokens.totalTokens,
        models: stats.llm.models.join(','),
      },
      groups: { collectivite: String(job.collectiviteId) },
    });

    // Hors transaction : un envoi manqué ne défait pas le plan créé.
    try {
      await this.importPlanService.notifyCreatedFiches(created);
    } catch (error) {
      this.logger.error(`Import ${job.id}: webhooks impossibles`, error);
    }
    try {
      await this.notifyPlanImportedService.notifyPlanImported({
        createdBy: job.createdBy,
        collectiviteId: job.collectiviteId,
        planId: created.planId,
        planName: job.options.planName,
        recap,
      });
    } catch (error) {
      this.logger.error(
        `Import ${job.id}: notification du plan ${created.planId} impossible`,
        error
      );
    }
  }

  private async recordFailure(
    jobId: string,
    message: string,
    reason: string,
    options: ImportFailureOptions = {}
  ): Promise<Result<undefined, GenerateImportDraftError>> {
    const marked = await this.markFailed(jobId, message, reason, options);
    return marked.success
      ? success(undefined)
      : failure({ kind: 'failure_record_failed', jobId, cause: marked.error });
  }
}

const secondsSince = (isoDate: string): number =>
  Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 1000));
