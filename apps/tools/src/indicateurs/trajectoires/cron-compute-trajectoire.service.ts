import {
  CalculTrajectoireRequestType,
  CalculTrajectoireReset,
} from '@/backend/indicateurs/trajectoires/calcul-trajectoire.request';
import { CalculTrajectoireResponse } from '@/backend/indicateurs/trajectoires/calcul-trajectoire.response';
import { COLLECTIVITE_SOURCE_ID } from '@/backend/indicateurs/valeurs/valeurs.constants';
import { VerificationTrajectoireStatus } from '@/domain/indicateurs';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { chunk } from 'es-toolkit';
import { TrpcClientService } from '../../utils/trpc/trpc-client.service';

export const COMPUTE_TRAJECTOIRE_QUEUE_NAME = 'compute-trajectoire';

@Processor(COMPUTE_TRAJECTOIRE_QUEUE_NAME)
export class CronComputeTrajectoireService extends WorkerHost {
  private readonly logger = new Logger(CronComputeTrajectoireService.name);

  static MAX_COMPLETED_JOB_TO_KEEP = 2000;

  static readonly DEFAULT_JOB_OPTIONS = {
    removeOnComplete: CronComputeTrajectoireService.MAX_COMPLETED_JOB_TO_KEEP,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30000, // 30 seconds, due to spreadsheet rate limiting
    },
  };

  private readonly COLLECTIVITE_CHUNK_SIZE = 10;

  constructor(
    private readonly trpcClient: TrpcClientService,
    @InjectQueue(COMPUTE_TRAJECTOIRE_QUEUE_NAME)
    private readonly computeTrajectoireQueue: Queue<
      CalculTrajectoireRequestType,
      CalculTrajectoireResponse,
      string
    >
  ) {
    super();
  }

  async computeTrajectoireIfOutdated(
    collectiviteId: number,
    forceEvenIfNotOutdated?: boolean
  ): Promise<{
    status: VerificationTrajectoireStatus;
    jobId: string | null;
    request: CalculTrajectoireRequestType | null;
  }> {
    const trajectoireStatus = await this.trpcClient
      .getClient()
      .indicateurs.trajectoires.snbc.checkStatus.query({
        collectiviteId,
        forceRecuperationDonnees: true,
      });

    const result: {
      status: VerificationTrajectoireStatus;
      jobId: string | null;
      request: CalculTrajectoireRequestType | null;
    } = {
      status: trajectoireStatus.status,
      jobId: null,
      request: null,
    };

    this.logger.log(
      `Trajectoire SNBC status for collectivite ${collectiviteId}: ${trajectoireStatus.status}`
    );
    if (
      trajectoireStatus.status ===
        VerificationTrajectoireStatus.PRET_A_CALCULER ||
      trajectoireStatus.status ===
        VerificationTrajectoireStatus.MISE_A_JOUR_DISPONIBLE ||
      (trajectoireStatus.status ===
        VerificationTrajectoireStatus.DEJA_CALCULE &&
        forceEvenIfNotOutdated)
    ) {
      this.logger.log(
        `Trajectoire SNBC is ready to be computed or updated for ${collectiviteId} (status: ${trajectoireStatus.status}, forceEvenIfNotOutdated: ${forceEvenIfNotOutdated})`
      );

      const computeTrajectoireRequest: CalculTrajectoireRequestType = {
        collectiviteId,
      };
      if (
        trajectoireStatus.status ===
          VerificationTrajectoireStatus.MISE_A_JOUR_DISPONIBLE ||
        (trajectoireStatus.status ===
          VerificationTrajectoireStatus.DEJA_CALCULE &&
          forceEvenIfNotOutdated)
      ) {
        computeTrajectoireRequest.mode =
          CalculTrajectoireReset.MAJ_SPREADSHEET_EXISTANT;
        computeTrajectoireRequest.forceUtilisationDonneesCollectivite =
          trajectoireStatus.sourcesDonneesEntree?.includes(
            COLLECTIVITE_SOURCE_ID
          );
      }

      // Publish the message to the queue: useful to be able to process collectivite one by one, track easily failure and retry through the UI
      // TODO: optimize with bulk add? No need to do it for now
      this.computeTrajectoireQueue
        .add(`${collectiviteId}`, computeTrajectoireRequest)
        .then((job) => {
          result.jobId = job.id || null;
          this.logger.log(
            `Added job ${job.id} for collectivite ${collectiviteId}`
          );
        });

      result.request = computeTrajectoireRequest;
    }
    return result;
  }

  async computeAllOutdatedTrajectoires(args?: {
    forceEvenIfNotOutdated?: boolean;
  }) {
    this.logger.log(
      `Automatically compute trajectoires SNBC for epci collectivités (forceEvenIfNotOutdated: ${args?.forceEvenIfNotOutdated})`
    );
    const collectivites: {
      id: number;
      nom: string | null;
      status?: VerificationTrajectoireStatus;
      jobId?: string | null;
    }[] = await this.trpcClient
      .getClient()
      .collectivites.collectivites.list.query({
        type: 'epci',
        limit: -1,
      });
    this.logger.log(`Found ${collectivites.length} epci collectivités`);

    const collectiviteChunks = chunk(
      collectivites,
      this.COLLECTIVITE_CHUNK_SIZE
    );

    let computedCount = 0;
    const publishMessagePromises: Promise<CalculTrajectoireRequestType | null>[] =
      [];
    let iChunk = 1;
    for (const collectiviteChunk of collectiviteChunks) {
      collectiviteChunk.forEach((collectivite) => {
        publishMessagePromises.push(
          this.computeTrajectoireIfOutdated(
            collectivite.id,
            args?.forceEvenIfNotOutdated
          ).then((result) => {
            collectivite.status = result.status;
            collectivite.jobId = result.jobId || null;
            if (result.request) {
              computedCount++;
            }
            return result.request;
          })
        );
      });

      await Promise.all(publishMessagePromises);
      publishMessagePromises.length = 0;
      this.logger.log(
        `Processed ${iChunk}/${collectiviteChunks.length} collectivite chunks, ${computedCount} trajectoire to be computed up to now`
      );
      iChunk++;
    }

    return {
      collectiviteCount: collectivites.length,
      computedCount,
      collectivites,
    };
  }

  async process(
    job: Job<CalculTrajectoireRequestType, CalculTrajectoireResponse, string>
  ): Promise<CalculTrajectoireResponse> {
    this.logger.log(
      `Calcul automatique de la trajectoire SNBC pour la collectivité ${job.data.collectiviteId} (mode ${job.data.mode}, forceUtilisationDonneesCollectivite: ${job.data.forceUtilisationDonneesCollectivite})`
    );

    const response = await this.trpcClient
      .getClient()
      .indicateurs.trajectoires.snbc.getOrCompute.query(job.data);

    return response;
  }
}
