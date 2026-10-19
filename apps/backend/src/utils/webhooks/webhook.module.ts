import { Module } from '@nestjs/common';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { WebhookService } from './webhook.service';

@Module({
  imports: [
    DatabaseModule,
    OutboxModule.forRoot({ relay: { enabled: false } }),
  ],
  providers: [
    {
      provide: PostgresOutboxStore,
      inject: [DatabaseService, OutboxStorage],
      useFactory: (database: DatabaseService, storage: OutboxStorage) =>
        new PostgresOutboxStore(
          { executor: fromDrizzle(database.db), migrate: false },
          storage
        ),
    },
    WebhookService,
  ],
  exports: [WebhookService],
})
export class WebhookModule {}
