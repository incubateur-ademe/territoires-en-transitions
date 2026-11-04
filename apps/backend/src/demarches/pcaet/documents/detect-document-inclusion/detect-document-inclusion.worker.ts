import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { getErrorMessage } from '@tet/domain/utils';
import { Job, UnrecoverableError } from 'bullmq';
import {
  DETECT_DOCUMENT_INCLUSION_LOCK_DURATION_MS,
  DETECT_DOCUMENT_INCLUSION_QUEUE_NAME,
  type DetectDocumentInclusionJobData,
} from './detect-document-inclusion.queue';
import { DetectDocumentInclusionRepository } from './detect-document-inclusion.repository';
import { DetectDocumentInclusionService } from './detect-document-inclusion.service';

@Processor(DETECT_DOCUMENT_INCLUSION_QUEUE_NAME, {
  lockDuration: DETECT_DOCUMENT_INCLUSION_LOCK_DURATION_MS,
  concurrency: 1,
  maxStalledCount: 1,
})
export class DetectDocumentInclusionWorker extends WorkerHost {
  private readonly logger = new Logger(DetectDocumentInclusionWorker.name);

  constructor(
    private readonly service: DetectDocumentInclusionService,
    private readonly repository: DetectDocumentInclusionRepository
  ) {
    super();
  }

  async process(job: Job<DetectDocumentInclusionJobData>): Promise<void> {
    const result = await this.service.detect(job.data);
    if (!result.success) {
      throw new UnrecoverableError(result.error);
    }
  }

  /** Sans quoi l'écran attendrait indéfiniment le résultat. */
  @OnWorkerEvent('failed')
  async onJobFailed(
    job: Job<DetectDocumentInclusionJobData> | undefined,
    error: Error
  ): Promise<void> {
    if (job === undefined) {
      return;
    }
    this.logger.error(
      `Detection ${job.data.detectionId} interrupted: ${getErrorMessage(error)}`
    );
    await this.repository.markFailed(
      { id: job.data.detectionId, fichierId: job.data.fichierId },
      `Analyse interrompue : ${getErrorMessage(error)}`
    );
  }
}
