import { Processor, WorkerHost } from '@nestjs/bullmq';
import { UnrecoverableError, type Job } from 'bullmq';
import { AnalysisJobRepository } from '../analysis-job.repository';
import { toDeadlineSignal } from '../models/analysis-job';
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
  maxStalledCount: 0,
})
export class ClassifyBatchWorker extends WorkerHost {
  constructor(
    private readonly service: ClassifyBatchService,
    private readonly jobRepository: AnalysisJobRepository
  ) {
    super();
  }

  async process(job: Job<ClassifyBatchJobData>): Promise<ClassifyBatchOutcome> {
    const { jobId, enjeu, fiches, deadlineAt } = job.data;

    const classification = await this.service.classify({
      enjeu,
      fiches,
      signal: toDeadlineSignal(deadlineAt),
    });
    if (classification.success) {
      await this.jobRepository.addTokenUsage(jobId, classification.data.tokens);
      await this.jobRepository.countProcessedBatch(jobId);
      return classification.data;
    }

    const message = `Lot de ${fiches.length} fiche(s) non classé (${classification.error.kind})`;
    if (UNRETRYABLE_KINDS.has(classification.error.kind)) {
      throw new UnrecoverableError(message);
    }
    throw new Error(message);
  }
}
