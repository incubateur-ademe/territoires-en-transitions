import { failure, success } from '@tet/backend/utils/result.type';
import { Job, UnrecoverableError } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import type { ClassificationVoletsJobData } from '../classification-volets.queue';
import { GenerateClassificationError } from './generate-classification.service';
import { GenerateClassificationWorker } from './generate-classification.worker';

const jobId = '00000000-0000-0000-0000-000000000001';

const toJob = ({
  attemptsMade = 1,
  attempts = 1,
}: {
  attemptsMade?: number;
  attempts?: number;
} = {}): Job<ClassificationVoletsJobData> =>
  ({
    data: { jobId },
    attemptsMade,
    opts: { attempts },
  } as unknown as Job<ClassificationVoletsJobData>);

type ServiceStub = {
  generate: ReturnType<typeof vi.fn>;
  recordTerminalFailure: ReturnType<typeof vi.fn>;
};

const toServiceStub = (
  generateOutcome: unknown = success(undefined)
): ServiceStub => ({
  generate: vi.fn().mockResolvedValue(generateOutcome),
  recordTerminalFailure: vi.fn().mockResolvedValue(undefined),
});

const toWorker = (service: ServiceStub): GenerateClassificationWorker =>
  new GenerateClassificationWorker(service as never);

describe('GenerateClassificationWorker.process', () => {
  it('ne throw pas quand la classification aboutit', async () => {
    const worker = toWorker(toServiceStub(success(undefined)));

    await expect(worker.process(toJob())).resolves.toBeUndefined();
  });

  it("throw une UnrecoverableError sur echec, pour qu'aucun second appel au modele ne soit paye", async () => {
    const interrupted: GenerateClassificationError = {
      kind: 'interrupted',
      jobId,
      message: 'Aucune fiche a classer dans ce plan',
    };
    const worker = toWorker(toServiceStub(failure(interrupted)));

    const processing = worker.process(toJob());

    await expect(processing).rejects.toBeInstanceOf(UnrecoverableError);
    await expect(processing).rejects.toThrow(
      'Aucune fiche a classer dans ce plan'
    );
  });

  it('reporte la cause de la transition refusee dans le message', async () => {
    const transitionFailed: GenerateClassificationError = {
      kind: 'transition_failed',
      jobId,
      cause: 'JOB_TRANSITION_REFUSED',
    };
    const worker = toWorker(toServiceStub(failure(transitionFailed)));

    await expect(worker.process(toJob())).rejects.toThrow(
      `Transition du job ${jobId} impossible (JOB_TRANSITION_REFUSED)`
    );
  });
});

describe('GenerateClassificationWorker.onJobFailed', () => {
  it('enregistre l’echec terminal quand les tentatives sont epuisees', async () => {
    const service = toServiceStub();

    await toWorker(service).onJobFailed(
      toJob({ attemptsMade: 1, attempts: 1 }),
      new Error('boom')
    );

    expect(service.recordTerminalFailure).toHaveBeenCalledWith(
      jobId,
      'Classification interrompue: boom'
    );
  });

  it('enregistre l’echec des la premiere UnrecoverableError, meme si des tentatives restent', async () => {
    const service = toServiceStub();

    await toWorker(service).onJobFailed(
      toJob({ attemptsMade: 1, attempts: 3 }),
      new UnrecoverableError('definitif')
    );

    expect(service.recordTerminalFailure).toHaveBeenCalledWith(
      jobId,
      'Classification interrompue: definitif'
    );
  });

  it("n'enregistre rien tant qu'une tentative reste sur une erreur ordinaire", async () => {
    const service = toServiceStub();

    await toWorker(service).onJobFailed(
      toJob({ attemptsMade: 1, attempts: 3 }),
      new Error('transitoire')
    );

    expect(service.recordTerminalFailure).not.toHaveBeenCalled();
  });

  it("n'enregistre rien quand BullMQ ne fournit aucun job", async () => {
    const service = toServiceStub();

    await toWorker(service).onJobFailed(undefined, new Error('boom'));

    expect(service.recordTerminalFailure).not.toHaveBeenCalled();
  });
});
