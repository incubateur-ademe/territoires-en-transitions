import { CalendlySynchroService } from '@/tools-automation-api/calendly/calendly-synchro.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CRON_JOBS_QUEUE_NAME, JobName } from './cron.config';

@Processor(CRON_JOBS_QUEUE_NAME)
export class CronConsumerService extends WorkerHost {
  private readonly logger = new Logger(CronConsumerService.name);

  constructor(private readonly calendlySynchroService: CalendlySynchroService) {
    super();
  }

  async process(job: Job<unknown, unknown, JobName>): Promise<unknown> {
    this.logger.log(`Traitement du job "${job.name}"`);

    switch (job.name) {
      case 'calendly-synchro':
        return this.calendlySynchroService.process();

      default:
        this.logger.log(
          `Aucun traitement disponible pour le job "${job.name}"`
        );
    }
  }
}
