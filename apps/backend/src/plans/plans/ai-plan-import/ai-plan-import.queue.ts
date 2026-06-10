import type { JobsOptions } from 'bullmq';

export const AI_PLAN_IMPORT_QUEUE_NAME = 'ai_plan_import_generation';

export const AI_PLAN_IMPORT_LOCK_DURATION_MS = 2 * 60 * 1000;

export const AI_PLAN_IMPORT_CONCURRENCY = 1;

export const AI_PLAN_IMPORT_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export interface AiPlanImportJobData {
  jobId: string;
}
