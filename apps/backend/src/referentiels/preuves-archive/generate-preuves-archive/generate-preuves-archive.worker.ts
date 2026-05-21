import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { getErrorMessage } from '@tet/domain/utils';
import { Job, UnrecoverableError } from 'bullmq';
import {
  PREUVES_ARCHIVE_LOCK_DURATION_MS,
  PREUVES_ARCHIVE_QUEUE_NAME,
  type PreuvesArchiveJobData,
} from '../preuves-archive.queue';
import { GeneratePreuvesArchiveService } from './generate-preuves-archive.service';

/**
 * Frontière BullMQ : seul endroit autorisé à `throw` (les services retournent
 * des `Result`). BullMQ ne relance un job que si `process()` throw, et ne
 * retente pas un `UnrecoverableError` — d'où la traduction du flag `retryable`.
 */
@Processor(PREUVES_ARCHIVE_QUEUE_NAME, {
  lockDuration: PREUVES_ARCHIVE_LOCK_DURATION_MS,
  concurrency: 1,
})
export class GeneratePreuvesArchiveWorker extends WorkerHost {
  constructor(private readonly service: GeneratePreuvesArchiveService) {
    super();
  }

  async process(job: Job<PreuvesArchiveJobData>): Promise<void> {
    const result = await this.service.generate(job.data.archiveId);
    if (result.success) {
      return;
    }
    if (result.error.retryable) {
      throw new Error(result.error.message);
    }
    throw new UnrecoverableError(result.error.message);
  }

  /**
   * Le worker émet `failed` à CHAQUE tentative échouée, pas seulement à la
   * dernière. On ne marque la ligne DB `failed` qu'au dernier échec — retries
   * épuisés (`attemptsMade >= attempts`) ou erreur non-retryable
   * (`UnrecoverableError`, qui court-circuite les retries restants) — sinon la
   * ligne clignoterait `failed` entre deux retries. Marquer `failed` au terme
   * libère l'index unique partiel et permet à l'utilisateur de relancer.
   */
  @OnWorkerEvent('failed')
  async onJobFailed(
    job: Job<PreuvesArchiveJobData>,
    error: Error
  ): Promise<void> {
    if (!this.isTerminalFailure(job, error)) {
      return;
    }
    await this.service.markFailed(
      job.data.archiveId,
      `Génération interrompue: ${getErrorMessage(error)}`
    );
  }

  private isTerminalFailure(
    job: Job<PreuvesArchiveJobData>,
    error: Error
  ): boolean {
    if (error instanceof UnrecoverableError) {
      return true;
    }
    const maxAttempts = job.opts.attempts ?? 1;
    return job.attemptsMade >= maxAttempts;
  }
}
