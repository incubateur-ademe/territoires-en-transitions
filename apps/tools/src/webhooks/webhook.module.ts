import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { webhookJobOptions } from '@tet/backend/utils/webhooks/webhook.queue';
import { Database } from '../utils/database/database.type';
import { WebhookOutboxTransport } from './webhook-outbox.transport';
import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from '@tet/backend/utils/bullmq/queue-names.constants';
import { ConfigurationModule } from '../config/configuration.module';
import { DatabaseModule } from '../utils/database/database.module';
import { UtilsModule } from '../utils/utils.module';
import { WebhookConsumerService } from './webhook-consumer.service';

const webhookQueueModule = BullModule.registerQueue({
  name: WEBHOOK_NOTIFICATIONS_QUEUE_NAME,
  defaultJobOptions: webhookJobOptions,
});

@Module({
  imports: [
    webhookQueueModule,
    OutboxModule.forRootAsync({
      imports: [webhookQueueModule, DatabaseModule],
      transports: { webhooks: WebhookOutboxTransport },
      useFactory: () => ({
        route: () => 'webhooks',
        relay: { pollInterval: '1s', lease: '30s', publishTimeout: '10s' },
        retry: { attempts: 100, backoff: { delay: '1s', maxDelay: '5m' } },
      }),
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
  providers: [
    WebhookConsumerService,
    {
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: Database, storage: OutboxStorage) =>
        new PostgresOutboxStore(
          { executor: fromDrizzle(db), migrate: false },
          storage
        ),
    },
  ],
  exports: [BullModule],
})
export class WebhookModule {}
