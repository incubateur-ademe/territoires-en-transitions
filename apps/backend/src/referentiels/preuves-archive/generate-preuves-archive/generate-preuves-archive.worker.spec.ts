import { failure, success } from '@tet/backend/utils/result.type';
import { Job, UnrecoverableError } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import type { PreuvesArchiveJobData } from '../preuves-archive.queue';
import { GeneratePreuvesArchiveWorker } from './generate-preuves-archive.worker';

const archiveId = '00000000-0000-0000-0000-000000000001';

function makeJob(overrides: {
  attemptsMade?: number;
  attempts?: number;
}): Job<PreuvesArchiveJobData> {
  return {
    data: { archiveId },
    attemptsMade: overrides.attemptsMade ?? 1,
    opts: { attempts: overrides.attempts ?? 3 },
  } as unknown as Job<PreuvesArchiveJobData>;
}

function buildWorker(generate: () => unknown): {
  worker: GeneratePreuvesArchiveWorker;
} {
  const service = {
    generate: vi.fn().mockResolvedValue(generate()),
    markFailed: vi.fn().mockResolvedValue(undefined),
  };
  const worker = new GeneratePreuvesArchiveWorker(service as never);
  return { worker };
}

describe('GeneratePreuvesArchiveWorker.process', () => {
  it('ne throw pas quand generate réussit (job réussi pour BullMQ)', async () => {
    const { worker } = buildWorker(() => success(undefined));

    await expect(
      worker.process(makeJob({ attemptsMade: 1 }))
    ).resolves.toBeUndefined();
  });

  it('throw une Error sur échec retryable (BullMQ retentera avec backoff)', async () => {
    const { worker } = buildWorker(() =>
      failure({ message: 'Supabase 503', retryable: true })
    );

    const promise = worker.process(makeJob({ attemptsMade: 1 }));
    await expect(promise).rejects.toThrow('Supabase 503');
    await expect(promise).rejects.not.toBeInstanceOf(UnrecoverableError);
  });

  it('throw une UnrecoverableError sur échec non-retryable (pas de retry)', async () => {
    const { worker } = buildWorker(() =>
      failure({ message: 'permission révoquée', retryable: false })
    );

    await expect(
      worker.process(makeJob({ attemptsMade: 1 }))
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });
});

describe('GeneratePreuvesArchiveWorker.onJobFailed', () => {
  it('ne marque PAS failed tant que des tentatives restent', async () => {
    const service = { markFailed: vi.fn().mockResolvedValue(undefined) };
    const localWorker = new GeneratePreuvesArchiveWorker(service as never);

    await localWorker.onJobFailed(
      makeJob({ attemptsMade: 1, attempts: 3 }),
      new Error('transient')
    );

    expect(service.markFailed).not.toHaveBeenCalled();
  });

  it('marque failed quand les tentatives sont épuisées', async () => {
    const service = { markFailed: vi.fn().mockResolvedValue(undefined) };
    const localWorker = new GeneratePreuvesArchiveWorker(service as never);

    await localWorker.onJobFailed(
      makeJob({ attemptsMade: 3, attempts: 3 }),
      new Error('boom')
    );

    expect(service.markFailed).toHaveBeenCalledWith(
      archiveId,
      expect.stringContaining('boom')
    );
  });

  it('marque failed immédiatement sur UnrecoverableError, même si des tentatives restent', async () => {
    const service = { markFailed: vi.fn().mockResolvedValue(undefined) };
    const localWorker = new GeneratePreuvesArchiveWorker(service as never);

    await localWorker.onJobFailed(
      makeJob({ attemptsMade: 1, attempts: 3 }),
      new UnrecoverableError('définitif')
    );

    expect(service.markFailed).toHaveBeenCalledWith(
      archiveId,
      expect.stringContaining('définitif')
    );
  });
});
