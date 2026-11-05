import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationsModule } from '@tet/backend/utils/notifications/notifications.module';
import { AntivirusScanner } from './antivirus-scanner';
import { ClamdTcpScanner } from './clamd-tcp.scanner';
import { EnqueueScanFichierService } from './enqueue-scan-fichier.service';
import { IsFichierInfectedService } from './is-fichier-infected.service';
import { NotifyFichierInfecteService } from './notify-fichier-infecte/notify-fichier-infecte.service';
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
    NotificationsModule,
  ],
  providers: [
    { provide: AntivirusScanner, useClass: ClamdTcpScanner },
    ScanFichiersRepository,
    ScanFichiersService,
    ScanFichiersWorker,
    ScanFichiersRouter,
    NotifyFichierInfecteService,
    EnqueueScanFichierService,
    IsFichierInfectedService,
  ],
  exports: [
    ScanFichiersRouter,
    ScanFichiersService,
    EnqueueScanFichierService,
    IsFichierInfectedService,
  ],
})
export class ScanFichiersModule {}
