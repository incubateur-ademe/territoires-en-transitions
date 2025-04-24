import { CalendlyModule } from '@/tools-automation-api/calendly/calendly.module';
import { CronConsumerService } from '@/tools-automation-api/cron/cron-consumer.service';
import { CRON_JOBS_QUEUE_NAME } from '@/tools-automation-api/cron/cron.config';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { CronService } from './cron.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CRON_JOBS_QUEUE_NAME,
    }),
    BullBoardModule.forFeature({
      name: CRON_JOBS_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
    ConfigurationModule,
    CalendlyModule,
  ],
  controllers: [],
  providers: [CronService, CronConsumerService],
})

export class CronModule {}
