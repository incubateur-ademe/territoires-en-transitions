import { DefaultJobOptions } from 'bullmq';

export const webhookJobOptions: DefaultJobOptions = {
  removeOnComplete: 1000,
  attempts: 10,
  backoff: { type: 'exponential', delay: 1000 },
};
