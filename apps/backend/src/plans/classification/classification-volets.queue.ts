import type { JobsOptions } from 'bullmq';

export const CLASSIFICATION_VOLETS_QUEUE_NAME = 'classification_volets';

export const CLASSIFICATION_VOLETS_LOCK_DURATION_MS = 10 * 60 * 1000;

export const CLASSIFICATION_VOLETS_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export type ClassificationVoletsJobData = {
  jobId: string;
};
