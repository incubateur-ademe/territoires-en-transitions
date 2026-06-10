import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { getErrorMessage } from '@tet/domain/utils';
import { Job, UnrecoverableError } from 'bullmq';
import {
  AI_PLAN_IMPORT_CONCURRENCY,
  AI_PLAN_IMPORT_LOCK_DURATION_MS,
  AI_PLAN_IMPORT_QUEUE_NAME,
  type AiPlanImportJobData,
} from '../ai-plan-import.queue';
import {
  GenerateImportDraftError,
  GenerateImportDraftService,
} from './generate-import-draft.service';

@Processor(AI_PLAN_IMPORT_QUEUE_NAME, {
  lockDuration: AI_PLAN_IMPORT_LOCK_DURATION_MS,
  concurrency: AI_PLAN_IMPORT_CONCURRENCY,
  maxStalledCount: 0,
})
export class GenerateImportDraftWorker extends WorkerHost {
  constructor(private readonly service: GenerateImportDraftService) {
    super();
  }

  async process(job: Job<AiPlanImportJobData>): Promise<void> {
    const result = await this.service.generate(job.data.jobId);
    if (!result.success) {
      throw new UnrecoverableError(toErrorMessage(result.error));
    }
  }

  @OnWorkerEvent('failed')
  async onJobFailed(
    job: Job<AiPlanImportJobData>,
    error: Error
  ): Promise<void> {
    if (!this.isTerminalFailure(job, error)) {
      return;
    }
    await this.service.markFailed(
      job.data.jobId,
      `Import interrompu: ${getErrorMessage(error)}`
    );
  }

  private isTerminalFailure(
    job: Job<AiPlanImportJobData>,
    error: Error
  ): boolean {
    if (error instanceof UnrecoverableError) {
      return true;
    }
    const maxAttempts = job.opts.attempts ?? 1;
    return job.attemptsMade >= maxAttempts;
  }
}

const toErrorMessage = (error: GenerateImportDraftError): string => {
  switch (error.kind) {
    case 'transition_failed':
      return `Transition du job ${error.jobId} impossible (${error.cause})`;
    case 'failure_record_failed':
      return `Enregistrement de l'échec du job ${error.jobId} impossible (${error.cause})`;
    case 'draft_record_failed':
      return `Enregistrement du brouillon du job ${error.jobId} impossible (${error.cause})`;
    case 'interrupted':
      return error.message;
  }
};
