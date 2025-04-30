import { CalendlySynchroService } from '@/tools-automation-api/calendly/calendly-synchro.service';
import { ConnectSynchroService } from '@/tools-automation-api/connect/connect-synchro.service';
import { CronComputeTrajectoireService } from '@/tools-automation-api/indicateurs/trajectoires/cron-compute-trajectoire.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { Job } from 'bullmq';
import { CRON_JOBS_QUEUE_NAME, JobName } from './cron.config';

@Processor(CRON_JOBS_QUEUE_NAME)
export class CronConsumerService extends WorkerHost {
  private readonly logger = new Logger(CronConsumerService.name);

  constructor(
    private readonly calendlySynchroService: CalendlySynchroService,
    private readonly connectSynchroService: ConnectSynchroService,
    private readonly cronComputeTrajectoireService: CronComputeTrajectoireService
  ) {
    super();
  }

  async process(job: Job<unknown, unknown, JobName>): Promise<unknown> {
    this.logger.log(`Traitement du job "${job.name}"`);
    switch (job.name) {
      case 'calendly-synchro':
        return this.calendlySynchroService.process();
      case 'connect-synchro':
        return this.connectSynchroService.process();
      case 'compute-all-outdated-trajectoires':
        return this.cronComputeTrajectoireService.computeAllOutdatedTrajectoires();
      default:
        return this.handlerNotFound(job.name);
    }
  }

  private handlerNotFound(name: JobName) {
    const message = `Traitement non trouvé pour le job "${name}"`;
    this.logger.warn(message);
    return new NotFoundException(message);
  }
}
