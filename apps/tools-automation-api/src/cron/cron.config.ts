import { CronExpression } from '@nestjs/schedule';

export const CRON_JOBS_QUEUE_NAME = 'cron-jobs';

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
