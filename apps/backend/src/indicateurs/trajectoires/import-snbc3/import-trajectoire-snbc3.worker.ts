import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import { Job, UnrecoverableError } from 'bullmq';
import { ImportTrajectoireSnbc3Report } from './import-trajectoire-snbc3.input';
import {
  IMPORT_TRAJECTOIRE_SNBC3_LOCK_DURATION_MS,
  IMPORT_TRAJECTOIRE_SNBC3_QUEUE_NAME,
  ImportTrajectoireSnbc3JobData,
} from './import-trajectoire-snbc3.queue';
import { ImportTrajectoireSnbc3Service } from './import-trajectoire-snbc3.service';

/**
 * Frontière BullMQ : seul endroit qui `throw` (le service renvoie un
 * `Result`). Le rapport de l'import est la valeur de retour du job.
 */
@Processor(IMPORT_TRAJECTOIRE_SNBC3_QUEUE_NAME, {
  lockDuration: IMPORT_TRAJECTOIRE_SNBC3_LOCK_DURATION_MS,
  concurrency: 1,
  maxStalledCount: 1,
})
export class ImportTrajectoireSnbc3Worker extends WorkerHost {
  private readonly logger = new Logger(ImportTrajectoireSnbc3Worker.name);

  constructor(private readonly service: ImportTrajectoireSnbc3Service) {
    super();
  }

  async process(
    job: Job<ImportTrajectoireSnbc3JobData>
  ): Promise<ImportTrajectoireSnbc3Report> {
    const result = await this.service.importRelease(job.data);
    if (!result.success) {
      // Déjà consigné dans `last-import.json` par le service.
      throw new UnrecoverableError(result.error);
    }
    return result.data;
  }

  /**
   * Échec que le service n'a pas pu consigner : exception imprévue, ou job
   * abandonné après la mort répétée de son process.
   */
  @OnWorkerEvent('failed')
  async onJobFailed(
    job: Job<ImportTrajectoireSnbc3JobData> | undefined,
    error: Error
  ): Promise<void> {
    if (error instanceof UnrecoverableError || !job) return;
    this.logger.error(`Import SNBC 3 interrompu : ${getErrorMessage(error)}`);
    await this.service.recordFailure(job.data, getErrorMessage(error));
  }
}
