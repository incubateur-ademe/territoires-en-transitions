import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  SCAN_FICHIER_JOB_NAME,
  SCAN_FICHIERS_LOCK_DURATION_MS,
  SCAN_FICHIERS_QUEUE_NAME,
  type ScanFichierJobData,
} from './scan-fichiers.queue';
import {
  type ScanFichierOutcome,
  ScanFichiersService,
  type SweepFichiersReport,
} from './scan-fichiers.service';

// 2 : un fichier juste déposé n'attend pas la fin d'un balayage en cours.
@Processor(SCAN_FICHIERS_QUEUE_NAME, {
  lockDuration: SCAN_FICHIERS_LOCK_DURATION_MS,
  concurrency: 2,
})
export class ScanFichiersWorker extends WorkerHost {
  constructor(private readonly service: ScanFichiersService) {
    super();
  }

  async process(
    job: Job<ScanFichierJobData | Record<string, never>>
  ): Promise<SweepFichiersReport | ScanFichierOutcome> {
    if (job.name === SCAN_FICHIER_JOB_NAME) {
      const result = await this.service.scanFichier(
        job.data as ScanFichierJobData
      );
      if (!result.success) {
        throw new Error(`Analyse antivirus en échec : ${result.error}`);
      }
      return result.data;
    }

    const result = await this.service.sweep();
    if (!result.success) {
      throw new Error(`Balayage antivirus en échec : ${result.error}`);
    }
    return result.data;
  }
}
