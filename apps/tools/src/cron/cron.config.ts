import { CronExpression } from '@nestjs/schedule';
import { DefaultJobOptions } from 'bullmq';

export const CRON_JOBS_QUEUE_NAME = 'cron-jobs';

export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  removeOnComplete: 1000,
  attempts: 10,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};

export const JOBS_CONFIG = [
  {
    name: 'calendly-synchro',
    cronExpression: CronExpression.EVERY_HOUR,
    data: {},
  },
  {
    name: 'connect-synchro',
    cronExpression: CronExpression.EVERY_DAY_AT_1AM,
    data: {},
  },
  {
    name: 'compute-all-outdated-trajectoires',
    cronExpression: CronExpression.EVERY_DAY_AT_1AM,
    data: {},
  },
] as const;

export type JobConfig = (typeof JOBS_CONFIG)[number];
export type JobName = JobConfig['name'];
