import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { Queue } from 'bullmq';
import { z } from 'zod';
import {
  SCAN_FICHIERS_QUEUE_NAME,
  SWEEP_FICHIERS_JOB_ID,
  SWEEP_FICHIERS_JOB_NAME,
} from './scan-fichiers.queue';

@Injectable()
export class ScanFichiersRouter {
  constructor(
    private readonly trpc: TrpcService,
    @InjectQueue(SCAN_FICHIERS_QUEUE_NAME) private readonly queue: Queue
  ) {}

  router = this.trpc.router({
    /**
     * Déclenche un balayage antivirus, appelé par le planificateur. Rend la
     * main aussitôt : l'analyse tourne dans le worker.
     */
    scanFichiers: this.trpc.serviceRoleProcedure
      .input(z.object({}))
      .mutation(async () => {
        await this.queue.add(
          SWEEP_FICHIERS_JOB_NAME,
          {},
          { jobId: SWEEP_FICHIERS_JOB_ID }
        );
        return { enqueued: true };
      }),
  });
}
