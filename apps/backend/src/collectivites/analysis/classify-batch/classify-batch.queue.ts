import { Enjeu } from '@tet/domain/shared';
import type { JobsOptions } from 'bullmq';
import { FicheToClassify } from '../pipeline/classify-fiches/render-fiches-text';

export const CLASSIFY_BATCH_QUEUE_NAME = 'classify_batch';

export const CLASSIFY_BATCH_LOCK_DURATION_MS = 10 * 60 * 1000;

export const CLASSIFY_BATCH_IN_PARALLEL = 5;

export const FICHES_PER_BATCH = 25;

export const CLASSIFY_BATCH_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export type ClassifyBatchJobData = {
  jobId: string;
  enjeu: Enjeu;
  fiches: FicheToClassify[];
  deadlineAt: string;
};
