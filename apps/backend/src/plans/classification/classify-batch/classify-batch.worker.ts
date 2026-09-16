import { Processor, WorkerHost } from '@nestjs/bullmq';
import { UnrecoverableError, type Job } from 'bullmq';
import {
  CLASSIFY_BATCH_IN_PARALLEL,
  CLASSIFY_BATCH_LOCK_DURATION_MS,
  CLASSIFY_BATCH_QUEUE_NAME,
  type ClassifyBatchJobData,
} from './classify-batch.queue';
import {
  ClassifyBatchFailure,
  ClassifyBatchOutcome,
  ClassifyBatchService,
} from './classify-batch.service';

const UNRETRYABLE_KINDS = new Set<ClassifyBatchFailure['kind']>([
  'unknown_enjeu',
  'empty_batch',
  'batch_too_large',
]);

@Processor(CLASSIFY_BATCH_QUEUE_NAME, {
  lockDuration: CLASSIFY_BATCH_LOCK_DURATION_MS,
  concurrency: CLASSIFY_BATCH_IN_PARALLEL,
})
export class ClassifyBatchWorker extends WorkerHost {
  constructor(private readonly service: ClassifyBatchService) {
    super();
  }

  async process(job: Job<ClassifyBatchJobData>): Promise<ClassifyBatchOutcome> {
    const { enjeu, fiches } = job.data;

    const classification = await this.service.classify({ enjeu, fiches });
    if (classification.success) {
      return classification.data;
    }

    const message = `Lot de ${fiches.length} fiche(s) non classé (${classification.error.kind})`;
    if (UNRETRYABLE_KINDS.has(classification.error.kind)) {
      throw new UnrecoverableError(message);
    }
    throw new Error(message);
  }
}
