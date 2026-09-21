import { failure, success } from '@tet/backend/utils/result.type';
import { UnrecoverableError, type Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { type ClassifyBatchJobData } from './classify-batch.queue';
import { ClassifyBatchWorker } from './classify-batch.worker';

const toJob = (
  deadlineAt = new Date(Date.now() + 60_000).toISOString()
): Job<ClassifyBatchJobData> =>
  ({
    data: {
      jobId: '00000000-0000-0000-0000-000000000001',
      enjeu: 'ges',
      deadlineAt,
      fiches: [
        { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
      ],
    },
  } as unknown as Job<ClassifyBatchJobData>);

const toWorker = (outcome: unknown) => {
  const jobRepository = { countProcessedBatch: vi.fn() };
  const worker = new ClassifyBatchWorker(
    { classify: vi.fn().mockResolvedValue(outcome) } as never,
    jobRepository as never
  );

  return { worker, jobRepository };
};

const outcome = {
  classified: [],
  sources: [],
  tokens: {
    promptTokens: 1,
    cachedTokens: 0,
    candidatesTokens: 1,
    thoughtsTokens: 0,
    totalTokens: 2,
  },
};

describe('ClassifyBatchWorker.process', () => {
  it('compte le lot dans la progression du job quand il aboutit', async () => {
    const { worker, jobRepository } = toWorker(success(outcome));

    await worker.process(toJob());

    expect(jobRepository.countProcessedBatch.mock.calls).toEqual([
      ['00000000-0000-0000-0000-000000000001'],
    ]);
  });

  it('ne compte pas un lot que le modele a refuse', async () => {
    const { worker, jobRepository } = toWorker(
      failure({ kind: 'rate_limited' })
    );

    await expect(worker.process(toJob())).rejects.toThrow();

    expect(jobRepository.countProcessedBatch.mock.calls).toEqual([]);
  });

  it('classe encore un lot enfile avant que le deadline existe', async () => {
    const { worker } = toWorker(success(outcome));

    await expect(worker.process(toJob(undefined))).resolves.toBe(outcome);
  });

  it('rend le classement du lot quand le modele repond', async () => {
    const { worker } = toWorker(success(outcome));

    await expect(worker.process(toJob())).resolves.toBe(outcome);
  });

  it('rejoue un lot que la limite de debit a fait echouer', async () => {
    const { worker } = toWorker(failure({ kind: 'rate_limited' }));

    await expect(worker.process(toJob())).rejects.not.toBeInstanceOf(
      UnrecoverableError
    );
  });

  it('rejoue un lot dont la reponse etait tronquee', async () => {
    const { worker } = toWorker(failure({ kind: 'truncated' }));

    await expect(worker.process(toJob())).rejects.not.toBeInstanceOf(
      UnrecoverableError
    );
  });

  it("ne rejoue pas un enjeu que l'application ne reconnait pas", async () => {
    const { worker } = toWorker(
      failure({ kind: 'unknown_enjeu', enjeu: 'biodiversite' })
    );

    await expect(worker.process(toJob())).rejects.toBeInstanceOf(
      UnrecoverableError
    );
  });

  it('ne rejoue pas un lot trop grand pour le modele', async () => {
    const { worker } = toWorker(
      failure({ kind: 'batch_too_large', count: 99 })
    );

    await expect(worker.process(toJob())).rejects.toBeInstanceOf(
      UnrecoverableError
    );
  });

  it('nomme la taille du lot et la cause du refus dans son erreur', async () => {
    const { worker } = toWorker(failure({ kind: 'rate_limited' }));

    await expect(worker.process(toJob())).rejects.toThrowError(
      'Lot de 1 fiche(s) non classé (rate_limited)'
    );
  });
});
