import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import { Job, UnrecoverableError } from 'bullmq';
import {
  CLASSIFICATION_VOLETS_LOCK_DURATION_MS,
  CLASSIFICATION_VOLETS_QUEUE_NAME,
  type ClassificationVoletsJobData,
} from '../classification-volets.queue';
import {
  GenerateClassificationError,
  GenerateClassificationService,
} from './generate-classification.service';

@Processor(CLASSIFICATION_VOLETS_QUEUE_NAME, {
  lockDuration: CLASSIFICATION_VOLETS_LOCK_DURATION_MS,
  concurrency: 1,
  maxStalledCount: 0,
})
export class GenerateClassificationWorker extends WorkerHost {
  private readonly logger = new Logger(GenerateClassificationWorker.name);

  constructor(private readonly service: GenerateClassificationService) {
    super();
  }

  async process(job: Job<ClassificationVoletsJobData>): Promise<void> {
    const generateResult = await this.service.generate(job.data.jobId);
    if (!generateResult.success) {
      throw new UnrecoverableError(toErrorMessage(generateResult.error));
    }
  }

  @OnWorkerEvent('failed')
  async onJobFailed(
    job: Job<ClassificationVoletsJobData> | undefined,
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
    job: Job<ClassificationVoletsJobData>,
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
