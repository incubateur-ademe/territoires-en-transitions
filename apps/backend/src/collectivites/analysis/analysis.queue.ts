import type { JobsOptions } from 'bullmq';

export const ANALYSIS_QUEUE_NAME = 'analysis';

export const ANALYSIS_FLOW_PRODUCER_NAME = 'analysis_leviers';

export const ANALYSIS_LOCK_DURATION_MS = 10 * 60 * 1000;

export const ANALYSIS_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export type AnalysisJobData = {
  jobId: string;
};
