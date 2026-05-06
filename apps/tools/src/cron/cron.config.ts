import { CronExpression } from '@nestjs/schedule';
import { DefaultJobOptions, JobsOptions } from 'bullmq';
import { CRM_SYNC_JOBS } from '../airtable/airtable-crm-sync.service';

export const CRON_JOBS_QUEUE_NAME = 'cron-jobs';

export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  removeOnComplete: 1000,
  attempts: 10,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};

// Les jobs CRM tournent une fois par jour et sont idempotents : un retry du
// lendemain est plus utile que 10 retries serrés. On limite à 3 tentatives
// pour éviter d'inonder Sentry et de chevaucher la fenêtre du jour suivant
// en cas de panne Airtable.
const CRM_SYNC_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
};

const CRM_SYNC_JOBS_CONFIG = Object.entries(CRM_SYNC_JOBS).map(
  ([name, descriptor]) =>
    ({
      name,
      cronExpression: descriptor.cronExpression,
      data: {},
      jobOptions: CRM_SYNC_JOB_OPTIONS,
    } as const)
);

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
  {
    name: 'send-notifications',
    cronExpression: CronExpression.EVERY_MINUTE,
    data: {},
  },
  ...CRM_SYNC_JOBS_CONFIG,
] as const;

export type JobConfig = (typeof JOBS_CONFIG)[number];
export type JobName = JobConfig['name'];
