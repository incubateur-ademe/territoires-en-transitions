import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import { Job, UnrecoverableError } from 'bullmq';
import {
  MOBILISATION_VOLETS_LOCK_DURATION_MS,
  MOBILISATION_VOLETS_QUEUE_NAME,
  type MobilisationVoletsJobData,
} from '../mobilisation-volets.queue';
import {
  GenerateMobilisationError,
  GenerateMobilisationService,
} from './generate-mobilisation.service';

@Processor(MOBILISATION_VOLETS_QUEUE_NAME, {
  lockDuration: MOBILISATION_VOLETS_LOCK_DURATION_MS,
  concurrency: 1,
  maxStalledCount: 0,
})
export class GenerateMobilisationWorker extends WorkerHost {
  private readonly logger = new Logger(GenerateMobilisationWorker.name);

  constructor(private readonly service: GenerateMobilisationService) {
    super();
  }

  async process(job: Job<MobilisationVoletsJobData>): Promise<void> {
    const generateResult = await this.service.generate(job.data.jobId);
    if (!generateResult.success) {
      throw new UnrecoverableError(toErrorMessage(generateResult.error));
    }
  }

  @OnWorkerEvent('failed')
  async onJobFailed(
    job: Job<MobilisationVoletsJobData> | undefined,
    error: Error
  ): Promise<void> {
    const shouldRecordFailure =
      job !== undefined && this.isTerminalFailure(job, error);
    if (!shouldRecordFailure) {
      return;
    }
    await this.service.recordTerminalFailure(
      job.data.jobId,
      `Mobilisation interrompue: ${getErrorMessage(error)}`
    );
  }

  @OnWorkerEvent('stalled')
  onJobStalled(jobId: string): void {
    this.logger.warn(`Job de mobilisation ${jobId} stallé`);
  }

  @OnWorkerEvent('error')
  onWorkerError(error: Error): void {
    this.logger.error(
      `Worker de mobilisation en erreur: ${getErrorMessage(error)}`
    );
  }

  private isTerminalFailure(
    job: Job<MobilisationVoletsJobData>,
    error: Error
  ): boolean {
    if (error instanceof UnrecoverableError) {
      return true;
    }
    const maxAttempts = job.opts.attempts ?? 1;
    return job.attemptsMade >= maxAttempts;
  }
}

const toErrorMessage = (error: GenerateMobilisationError): string => {
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
