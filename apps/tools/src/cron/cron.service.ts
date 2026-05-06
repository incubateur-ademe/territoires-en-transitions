import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { CronJob, CronTime } from 'cron';
import { DateTime } from 'luxon';
import ConfigurationService from '../config/configuration.service';
import { CRON_JOBS_QUEUE_NAME, JobConfig, JOBS_CONFIG } from './cron.config';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectQueue(CRON_JOBS_QUEUE_NAME) private readonly cronQueue: Queue
  ) {
    const enableCronJobs = 'ENABLE_CRON_JOBS';
    if (!this.configurationService.get(enableCronJobs)) {
      this.logger.log(
        `Les cron jobs sont désactivés (définir la variable ${enableCronJobs} pour les activer)`
      );
      return;
    }
    const cronJobsFilter: string[] | undefined =
      this.configurationService.get('CRON_JOBS_FILTER');

    JOBS_CONFIG.forEach((job) => {
      if (cronJobsFilter && !cronJobsFilter.includes(job.name)) {
        this.logger.log(
          `Cron job "${job.name}" non activé car filtré (filtre: ${cronJobsFilter.join(', ')})`
        );
        return;
      }
      this.addCronJob(job);
    });
  }

  addCronJob(jobConfig: JobConfig) {
    const { name, cronExpression, data } = jobConfig;
    // jobOptions est optionnel : seuls les jobs CRM (et tout job qui veut
    // surcharger DEFAULT_JOB_OPTIONS) en déclarent un.
    const jobOptions =
      'jobOptions' in jobConfig ? jobConfig.jobOptions : undefined;

    const job = new CronJob(cronExpression, () => {
      this.cronQueue.add(name, data, jobOptions);
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    this.logger.log(
      `Job "${name}" ajouté. Prochain démarrage le ${new CronTime(
        cronExpression
      )
        .getNextDateFrom(new Date())
        .toLocaleString(DateTime.DATETIME_FULL)}`
    );
  }
}
