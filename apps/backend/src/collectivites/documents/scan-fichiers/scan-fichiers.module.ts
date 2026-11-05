import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AntivirusScanner } from './antivirus-scanner';
import { ClamdTcpScanner } from './clamd-tcp.scanner';
import {
  SCAN_FICHIERS_JOB_OPTIONS,
  SCAN_FICHIERS_QUEUE_NAME,
} from './scan-fichiers.queue';
import { ScanFichiersRepository } from './scan-fichiers.repository';
import { ScanFichiersRouter } from './scan-fichiers.router';
import { ScanFichiersService } from './scan-fichiers.service';
import { ScanFichiersWorker } from './scan-fichiers.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCAN_FICHIERS_QUEUE_NAME,
      defaultJobOptions: SCAN_FICHIERS_JOB_OPTIONS,
    }),
  ],
  providers: [
    { provide: AntivirusScanner, useClass: ClamdTcpScanner },
    ScanFichiersRepository,
    ScanFichiersService,
    ScanFichiersWorker,
    ScanFichiersRouter,
  ],
  exports: [ScanFichiersRouter, ScanFichiersService],
})
export class ScanFichiersModule {}
