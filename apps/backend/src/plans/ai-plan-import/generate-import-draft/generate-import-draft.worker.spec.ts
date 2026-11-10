import { failure, success } from '@tet/backend/utils/result.type';
import { Job, UnrecoverableError } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { type AiPlanImportJobData } from '../ai-plan-import.queue';
import { GenerateImportDraftService } from './generate-import-draft.service';
import { GenerateImportDraftWorker } from './generate-import-draft.worker';

const toJob = (overrides: {
  attempts?: number;
  attemptsMade: number;
  executionAttempt?: number;
}): Job<AiPlanImportJobData> =>
  ({
    data: { jobId: 'job-1', executionAttempt: overrides.executionAttempt },
    opts: { attempts: overrides.attempts ?? 1 },
    attemptsMade: overrides.attemptsMade,
  } as unknown as Job<AiPlanImportJobData>);

const buildWorker = (generateResult: 'success' | 'failure') => {
  const service = {
    generate: vi.fn(async () =>
      generateResult === 'success'
        ? success(undefined)
        : failure({
            kind: 'interrupted',
            jobId: 'job-1',
            message: 'Import interrompu: boom',
          })
    ),
    recordTerminalFailure: vi.fn(async () => undefined),
  } as unknown as GenerateImportDraftService;
  return { worker: new GenerateImportDraftWorker(service), service };
};

describe('GenerateImportDraftWorker', () => {
  it('conserve le passage pris en base avant de traiter le document', async () => {
    const { worker, service } = buildWorker('success');
    const job = toJob({ attemptsMade: 0 });
    const updateData = vi.fn(async (data: AiPlanImportJobData) => {
      job.data = data;
    });
    job.updateData = updateData;
    vi.mocked(service.generate).mockImplementation(
      async (_jobId, onStarted) => {
        await onStarted?.(3);
        expect(job.data.executionAttempt).toBe(3);
        return success(undefined);
      }
    );

    await worker.process(job);
    await worker.onJobFailed(job, new UnrecoverableError('interruption'));

    expect(updateData).toHaveBeenCalledWith({
      jobId: 'job-1',
      executionAttempt: 3,
    });
    expect(service.recordTerminalFailure).toHaveBeenCalledWith(
      'job-1',
      'Import interrompu: interruption',
      3
    );
  });

  it('transmet le passage de cet événement tardif pour que la base protège la reprise suivante', async () => {
    const { worker, service } = buildWorker('success');

    await worker.onJobFailed(
      toJob({ attemptsMade: 1, executionAttempt: 2 }),
      new UnrecoverableError('ancien worker')
    );

    expect(service.recordTerminalFailure).toHaveBeenCalledWith(
      'job-1',
      'Import interrompu: ancien worker',
      2
    );
  });

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

    expect(service.recordTerminalFailure).toHaveBeenCalledWith(
      'job-1',
      'Import interrompu: job stalled more than allowable limit',
      0
    );
  });

  it('marque le job failed sur une UnrecoverableError même avant la dernière tentative', async () => {
    const { worker, service } = buildWorker('success');

    await worker.onJobFailed(
      toJob({ attempts: 3, attemptsMade: 1 }),
      new UnrecoverableError('définitif')
    );

    expect(service.recordTerminalFailure).toHaveBeenCalled();
  });

  it("ne fait rien quand l'évènement failed arrive sans job (échec connexion)", async () => {
    const { worker, service } = buildWorker('success');

    await worker.onJobFailed(undefined, new Error('connexion Redis perdue'));

    expect(service.recordTerminalFailure).not.toHaveBeenCalled();
  });

  it('ne marque pas le job failed sur un échec non terminal', async () => {
    const { worker, service } = buildWorker('success');

    await worker.onJobFailed(
      toJob({ attempts: 3, attemptsMade: 1 }),
      new Error('transitoire')
    );

    expect(service.recordTerminalFailure).not.toHaveBeenCalled();
  });
});
