import type { JobsOptions } from 'bullmq';

export const COMPLETE_PLAN_SECTEURS_QUEUE_NAME = 'complete_plan_secteurs';

export const COMPLETE_PLAN_SECTEURS_JOB_NAME = 'complete-plan-secteurs';

export const COMPLETE_PLAN_SECTEURS_LOCK_DURATION_MS = 10 * 60 * 1000;

export const COMPLETE_PLAN_SECTEURS_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export const NEXT_PASSAGE_DELAYS_MS = [
  5 * 60 * 1000,
  15 * 60 * 1000,
  30 * 60 * 1000,
];

export const MAX_PASSAGES = NEXT_PASSAGE_DELAYS_MS.length + 1;

export type CompletePlanSecteursJobData = {
  planId: number;
  collectiviteId: number;
  passage: number;
};

export const buildNextPassageJobId = ({
  planId,
  passage,
}: CompletePlanSecteursJobData) => `plan-${planId}-passage-${passage}`;
