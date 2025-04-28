import { CalendlySynchroService } from '@/tools-automation-api/calendly/calendly-synchro.service';
import { ConnectSynchroService } from '@/tools-automation-api/connect/connect-synchro.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CRON_JOBS_QUEUE_NAME, JobName } from './cron.config';

@Processor(CRON_JOBS_QUEUE_NAME)
export class CronConsumerService extends WorkerHost {
  private readonly logger = new Logger(CronConsumerService.name);

  private readonly handlers: Record<JobName, () => Promise<unknown>> = {
    'calendly-synchro': this.calendlySynchroService.process,
    'connect-synchro': this.connectSynchroService.process,
  };

  constructor(
    private readonly calendlySynchroService: CalendlySynchroService,
    private readonly connectSynchroService: ConnectSynchroService
  ) {
    super();
  }

  async process(job: Job<unknown, unknown, JobName>): Promise<unknown> {
    this.logger.log(`Traitement du job "${job.name}"`);
    return this.calendlySynchroService.process();
  }
}
