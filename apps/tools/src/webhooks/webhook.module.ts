import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from '@/backend/utils/bullmq/queue-names.constants';
import { UtilsModule } from '../utils/utils.module';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { DatabaseModule } from '../utils/database/database.module';
import { WebhookConsumerService } from './webhook-consumer.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: WEBHOOK_NOTIFICATIONS_QUEUE_NAME,
    }),
    BullBoardModule.forFeature({
      name: WEBHOOK_NOTIFICATIONS_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
    ConfigurationModule,
    UtilsModule,
    DatabaseModule,
  ],

  controllers: [],
  providers: [WebhookConsumerService],
})
export class WebhookModule {}
