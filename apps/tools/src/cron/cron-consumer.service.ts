import { ContextStoreService } from '@/backend/utils/context/context.service';
import { getErrorMessage } from '@/backend/utils/get-error-message';
import { getSentryContextFromApplicationContext } from '@/backend/utils/sentry-init';
import { CalendlySynchroService } from '@/tools/calendly/calendly-synchro.service';
import { ConnectSynchroService } from '@/tools/connect/connect-synchro.service';
import { CronComputeTrajectoireService } from '@/tools/indicateurs/trajectoires/cron-compute-trajectoire.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Job } from 'bullmq';
import { CronNotificationsService } from './cron-notifications.service';
import { CRON_JOBS_QUEUE_NAME, JobName } from './cron.config';

@Processor(CRON_JOBS_QUEUE_NAME)
export class CronConsumerService extends WorkerHost {
  private readonly logger = new Logger(CronConsumerService.name);

  constructor(
    private readonly calendlySynchroService: CalendlySynchroService,
    private readonly connectSynchroService: ConnectSynchroService,
    private readonly cronComputeTrajectoireService: CronComputeTrajectoireService,
    private readonly cronNotificationsService: CronNotificationsService,
    private readonly contextStoreService: ContextStoreService
  ) {
    super();
  }

  async process(job: Job<unknown, unknown, JobName>): Promise<unknown> {
    let result: unknown;
    try {
      this.logger.log(
        `Traitement du job "${job.name}" avec les paramètres ${JSON.stringify(
          job.data
        )}`
      );
      switch (job.name) {
        case 'calendly-synchro':
          result = await this.calendlySynchroService.process();
          break;
        case 'connect-synchro':
          result = await this.connectSynchroService.process();
          break;
        case 'compute-all-outdated-trajectoires':
          result =
            await this.cronComputeTrajectoireService.computeAllOutdatedTrajectoires(
              job.data as { forceEvenIfNotOutdated?: boolean }
            );
          break;
        case 'send-notifications':
          result =
            await this.cronNotificationsService.sendPendingNotifications();
          break;
        default:
          result = this.handlerNotFound(job.name);
          break;
      }
    } catch (error) {
      this.logger.error(error);
      this.logger.error(
        `Error processing job ${job.id} with name ${
          job.name
        } for queue ${CRON_JOBS_QUEUE_NAME}: ${getErrorMessage(error)}`
      );
      Sentry.captureException(
        error,
        getSentryContextFromApplicationContext(
          this.contextStoreService.getContext(),
          {
            jobId: job.id,
            jobName: job.name,
            queueName: CRON_JOBS_QUEUE_NAME,
          }
        )
      );

      // Throw to trigger retry
      throw error;
    }
    return result;
  }

  private handlerNotFound(name: JobName) {
    const message = `Traitement non trouvé pour le job "${name}"`;
    this.logger.warn(message);
    return new NotFoundException(message);
  }
}
