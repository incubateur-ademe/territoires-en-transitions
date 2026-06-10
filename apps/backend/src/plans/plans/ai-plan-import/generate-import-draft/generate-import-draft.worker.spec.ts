import { failure, success } from '@tet/backend/utils/result.type';
import { Job, UnrecoverableError } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { type AiPlanImportJobData } from '../ai-plan-import.queue';
import { GenerateImportDraftService } from './generate-import-draft.service';
import { GenerateImportDraftWorker } from './generate-import-draft.worker';

const toJob = (overrides: {
  attempts?: number;
  attemptsMade: number;
}): Job<AiPlanImportJobData> =>
  ({
    data: { jobId: 'job-1' },
    opts: { attempts: overrides.attempts ?? 1 },
    attemptsMade: overrides.attemptsMade,
  } as unknown as Job<AiPlanImportJobData>);

const buildWorker = (generateResult: 'success' | 'failure') => {
  const service = {
    generate: vi.fn(async () =>
      generateResult === 'success'
        ? success(undefined)
        : failure('Import interrompu: boom')
    ),
    markFailed: vi.fn(async () => undefined),
  } as unknown as GenerateImportDraftService;
  return { worker: new GenerateImportDraftWorker(service), service };
};

describe('GenerateImportDraftWorker', () => {
  it('lève une UnrecoverableError quand le service échoue', async () => {
    const { worker } = buildWorker('failure');

    await expect(
      worker.process(toJob({ attemptsMade: 0 }))
    ).rejects.toThrowError(UnrecoverableError);
  });

  it('marque le job failed sur un échec terminal (tentatives épuisées)', async () => {
    const { worker, service } = buildWorker('success');

    await worker.onJobFailed(
      toJob({ attemptsMade: 1 }),
      new Error('job stalled more than allowable limit')
    );

    expect(service.markFailed).toHaveBeenCalledWith(
      'job-1',
      'Import interrompu: job stalled more than allowable limit'
    );
  });

  it('marque le job failed sur une UnrecoverableError même avant la dernière tentative', async () => {
    const { worker, service } = buildWorker('success');

    await worker.onJobFailed(
      toJob({ attempts: 3, attemptsMade: 1 }),
      new UnrecoverableError('définitif')
    );

    expect(service.markFailed).toHaveBeenCalled();
  });

  it('ne marque pas le job failed sur un échec non terminal', async () => {
    const { worker, service } = buildWorker('success');

    await worker.onJobFailed(
      toJob({ attempts: 3, attemptsMade: 1 }),
      new Error('transitoire')
    );

    expect(service.markFailed).not.toHaveBeenCalled();
  });
});
