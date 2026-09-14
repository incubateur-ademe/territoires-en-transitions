import type { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { CronConsumerService } from './cron-consumer.service';
import type { JobName } from './cron.config';

describe('CronConsumerService', () => {
  it('délègue le job de réconciliation des formules au service dédié', async () => {
    const drainResult = {
      processedCount: 2,
      obsoleteCount: 0,
      failedCount: 0,
      remainingCount: 0,
      complete: true,
      identifiants: ['target_a', 'target_b'],
    };
    const drain = vi.fn().mockResolvedValue(drainResult);
    const service = new CronConsumerService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { drain } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    const result = await service.process({
      name: 'drain-indicateur-formula-reconciliations',
      data: {},
    } as Job<unknown, unknown, JobName>);

    expect(result).toEqual(drainResult);
    expect(drain).toHaveBeenCalledExactlyOnceWith();
  });
});
