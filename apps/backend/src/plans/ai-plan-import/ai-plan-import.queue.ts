import type { JobsOptions } from 'bullmq';

export const AI_PLAN_IMPORT_QUEUE_NAME = 'ai_plan_import_generation';

export const GENERATE_IMPORT_DRAFT_JOB_NAME = 'generate-import-draft';

export const AI_PLAN_IMPORT_LOCK_DURATION_MS = 10 * 60 * 1000;

/**
 * Reprises automatiques d'un import dont le processus s'est arrêté. Une seule :
 * un document qui fait tomber le processus ne le relance qu'une fois.
 */
export const AI_PLAN_IMPORT_MAX_STALLED_RESUMES = 1;

export const AI_PLAN_IMPORT_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export type AiPlanImportJobData = {
  jobId: string;
};
