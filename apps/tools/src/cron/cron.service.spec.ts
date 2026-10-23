import { SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import ConfigurationService from '../config/configuration.service';
import { toolsAutomationApiConfigurationSchema } from '../config/configuration.model';
import { CronService } from './cron.service';

// No business dependencies or running schedulers are needed to check disabled startup.
vi.mock('./cron.config', () => ({
  CRON_JOBS_QUEUE_NAME: 'test-cron',
  JOBS_CONFIG: [{ name: 'test-job', cronExpression: '* * * * *', data: {} }],
}));

const schema = toolsAutomationApiConfigurationSchema.pick({
  BACKGROUND_TASKS_ENABLED: true,
  QUEUE_PREFIX: true,
});

describe('test target background tasks', () => {
  it('parses the disabled flag and keeps an isolated queue namespace', () => {
    expect(
      schema.parse({
        BACKGROUND_TASKS_ENABLED: 'false',
        QUEUE_PREFIX: 'staging-test',
      })
    ).toEqual({
      BACKGROUND_TASKS_ENABLED: false,
      QUEUE_PREFIX: 'staging-test',
    });
    expect(schema.parse({})).toEqual({
      BACKGROUND_TASKS_ENABLED: true,
      QUEUE_PREFIX: 'bull',
    });
  });

  it.each([
    { background: false, cron: true },
    { background: true, cron: false },
  ])(
    'does not schedule work when either switch is disabled (%j)',
    ({ background, cron }) => {
      const addCronJob = vi.fn();
      const add = vi.fn();
      const config = {
        get: (key: string) =>
          key === 'BACKGROUND_TASKS_ENABLED' ? background : cron,
      } as unknown as ConfigurationService;

      new CronService(
        config,
        { addCronJob } as unknown as SchedulerRegistry,
        { add } as unknown as Queue
      );

      expect(addCronJob).not.toHaveBeenCalled();
      expect(add).not.toHaveBeenCalled();
    }
  );
});
