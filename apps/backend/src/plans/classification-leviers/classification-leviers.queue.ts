import type { JobsOptions } from 'bullmq';

export const CLASSIFICATION_LEVIERS_QUEUE_NAME = 'classification_leviers';

export const CLASSIFICATION_LEVIERS_LOCK_DURATION_MS = 10 * 60 * 1000;

export const CLASSIFICATION_LEVIERS_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export type ClassificationLeviersJobData = {
  jobId: string;
};
