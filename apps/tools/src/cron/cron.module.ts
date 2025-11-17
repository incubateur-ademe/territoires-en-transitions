import { CalendlyModule } from '../calendly/calendly.module';
import { ConnectModule } from '../connect/connect.module';
import { CronConsumerService } from './cron-consumer.service';
import {
  CRON_JOBS_QUEUE_NAME,
  DEFAULT_JOB_OPTIONS,
} from './cron.config';
import { ToolsIndicateursModule } from '../indicateurs/tools-indicateurs.module';
import { UtilsModule } from '../utils/utils.module';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { CronNotificationsService } from './cron-notifications.service';
import { CronService } from './cron.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CRON_JOBS_QUEUE_NAME,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    }),
    BullBoardModule.forFeature({
      name: CRON_JOBS_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
    UtilsModule,
    ConfigurationModule,
    CalendlyModule,
    ConnectModule,
    ToolsIndicateursModule,
  ],
  controllers: [],
  providers: [CronService, CronConsumerService, CronNotificationsService],
})
export class CronModule {}
