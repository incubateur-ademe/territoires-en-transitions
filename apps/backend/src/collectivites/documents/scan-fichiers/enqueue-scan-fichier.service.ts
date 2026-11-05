import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import {
  getScanFichierJobId,
  SCAN_FICHIER_JOB_NAME,
  SCAN_FICHIER_JOB_OPTIONS,
  SCAN_FICHIERS_QUEUE_NAME,
  type ScanFichierJobData,
} from './scan-fichiers.queue';
import { ScanFichiersService } from './scan-fichiers.service';

/**
 * Met en file l'analyse d'un fichier juste déposé. Ne bloque ni ne fait
 * échouer le dépôt : si la file est injoignable, le balayage périodique
 * rattrapera le fichier.
 */
@Injectable()
export class EnqueueScanFichierService {
  private readonly logger = new Logger(EnqueueScanFichierService.name);

  constructor(
    @InjectQueue(SCAN_FICHIERS_QUEUE_NAME) private readonly queue: Queue,
    private readonly scanFichiersService: ScanFichiersService
  ) {}

  async enqueue(data: ScanFichierJobData): Promise<void> {
    if (!this.scanFichiersService.isEnabled()) {
      return;
    }
    try {
      await this.queue.add(SCAN_FICHIER_JOB_NAME, data, {
        ...SCAN_FICHIER_JOB_OPTIONS,
        jobId: getScanFichierJobId(data),
      });
    } catch (error) {
      this.logger.warn(
        `Analyse du fichier ${data.collectiviteId}/${
          data.hash
        } non mise en file, laissée au balayage : ${getErrorMessage(error)}`
      );
    }
  }
}
