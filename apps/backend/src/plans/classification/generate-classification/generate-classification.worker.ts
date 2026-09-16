import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import { Job, UnrecoverableError } from 'bullmq';
import {
  CLASSIFICATION_VOLETS_LOCK_DURATION_MS,
  CLASSIFICATION_VOLETS_QUEUE_NAME,
  type ClassificationVoletsJobData,
} from '../classification-volets.queue';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import { GenerateAnalysisService } from '../generate-analysis/generate-analysis.service';
import { toAnalysisErrorMessage } from '../models/analysis-error';

@Processor(CLASSIFICATION_VOLETS_QUEUE_NAME, {
  lockDuration: CLASSIFICATION_VOLETS_LOCK_DURATION_MS,
  concurrency: 1,
  maxStalledCount: 0,
})
export class GenerateClassificationWorker extends WorkerHost {
  private readonly logger = new Logger(GenerateClassificationWorker.name);

  constructor(private readonly service: GenerateAnalysisService) {
    super();
  }

  async process(job: Job<ClassificationVoletsJobData>): Promise<void> {
    const childrenValues = await job.getChildrenValues<ClassifyBatchOutcome>();
    const generateResult = await this.service.generate(
      job.data.jobId,
      Object.values(childrenValues)
    );
    if (!generateResult.success) {
      throw new UnrecoverableError(
        toAnalysisErrorMessage(generateResult.error)
      );
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
      `Analyse interrompue: ${getErrorMessage(error)}`
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
