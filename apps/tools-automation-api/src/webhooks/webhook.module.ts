import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from '@/domain/utils';
import { UtilsModule } from '@/tools-automation-api/utils/utils.module';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
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
    UtilsModule,
  ],

  controllers: [],
  providers: [WebhookConsumerService],
})
export class WebhookModule {}
