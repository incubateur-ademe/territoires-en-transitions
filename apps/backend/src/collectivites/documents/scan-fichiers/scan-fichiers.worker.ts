import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  SCAN_FICHIERS_LOCK_DURATION_MS,
  SCAN_FICHIERS_QUEUE_NAME,
} from './scan-fichiers.queue';
import {
  ScanFichiersService,
  type SweepFichiersReport,
} from './scan-fichiers.service';

@Processor(SCAN_FICHIERS_QUEUE_NAME, {
  lockDuration: SCAN_FICHIERS_LOCK_DURATION_MS,
  concurrency: 1,
})
export class ScanFichiersWorker extends WorkerHost {
  constructor(private readonly service: ScanFichiersService) {
    super();
  }

  async process(_job: Job): Promise<SweepFichiersReport> {
    const result = await this.service.sweep();
    if (!result.success) {
      throw new Error(`Balayage antivirus en échec : ${result.error}`);
    }
    return result.data;
  }
}
