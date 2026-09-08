import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import { Job, UnrecoverableError } from 'bullmq';
import {
  CLASSIFICATION_LEVIERS_LOCK_DURATION_MS,
  CLASSIFICATION_LEVIERS_QUEUE_NAME,
  type ClassificationLeviersJobData,
} from '../classification-leviers.queue';
import {
  GenerateClassificationError,
  GenerateClassificationService,
} from './generate-classification.service';

/**
 * `maxStalledCount: 0` évite le second appel LLM : un job stallé n'est pas
 * rejoué, il échoue en `UnrecoverableError` sans que `process` soit rappelé.
 * C'est le seul réglage qui transforme une dépense LLM dupliquée en silence en
 * échec visible.
 */
@Processor(CLASSIFICATION_LEVIERS_QUEUE_NAME, {
  lockDuration: CLASSIFICATION_LEVIERS_LOCK_DURATION_MS,
  concurrency: 1,
  maxStalledCount: 0,
})
export class GenerateClassificationWorker extends WorkerHost {
  private readonly logger = new Logger(GenerateClassificationWorker.name);

  constructor(private readonly service: GenerateClassificationService) {
    super();
  }

  async process(job: Job<ClassificationLeviersJobData>): Promise<void> {
    const generateResult = await this.service.generate(job.data.jobId);
    if (!generateResult.success) {
      throw new UnrecoverableError(toErrorMessage(generateResult.error));
    }
  }

  @OnWorkerEvent('failed')
  async onJobFailed(
    job: Job<ClassificationLeviersJobData> | undefined,
    error: Error
  ): Promise<void> {
    const shouldRecordFailure =
      job !== undefined && this.isTerminalFailure(job, error);
    if (!shouldRecordFailure) {
      return;
    }
    await this.service.recordTerminalFailure(
      job.data.jobId,
      `Classification interrompue: ${getErrorMessage(error)}`
    );
  }

  @OnWorkerEvent('stalled')
  onJobStalled(jobId: string): void {
    this.logger.warn(`Job de classification ${jobId} stallé`);
  }

  @OnWorkerEvent('error')
  onWorkerError(error: Error): void {
    this.logger.error(
      `Worker de classification en erreur: ${getErrorMessage(error)}`
    );
  }

  private isTerminalFailure(
    job: Job<ClassificationLeviersJobData>,
    error: Error
  ): boolean {
    if (error instanceof UnrecoverableError) {
      return true;
    }
    const maxAttempts = job.opts.attempts ?? 1;
    return job.attemptsMade >= maxAttempts;
  }
}

const toErrorMessage = (error: GenerateClassificationError): string => {
  switch (error.kind) {
    case 'job_unreadable':
      return `Job ${error.jobId} illisible (${error.cause})`;
    case 'transition_failed':
      return `Transition du job ${error.jobId} impossible (${error.cause})`;
    case 'failure_record_failed':
      return `Enregistrement de l'échec du job ${error.jobId} impossible (${error.cause})`;
    case 'interrupted':
      return error.message;
  }
};
