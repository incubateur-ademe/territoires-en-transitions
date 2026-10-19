import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  NonRetryableMessageError,
  OutboxMessage,
  OutboxTransport,
} from '@nestjs/outbox';
import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from '@tet/backend/utils/bullmq/queue-names.constants';
import { webhookMessageTable } from '@tet/backend/utils/webhooks/webhook-message.table';
import { webhookJobOptions } from '@tet/backend/utils/webhooks/webhook.queue';
import { Queue } from 'bullmq';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '../utils/database/database.type';

const payloadSchema = z.object({ messageId: z.uuid() });

@Injectable()
export class WebhookOutboxTransport extends OutboxTransport {
  constructor(
    @InjectQueue(WEBHOOK_NOTIFICATIONS_QUEUE_NAME)
    private readonly queue: Queue,
    @InjectDrizzle() private readonly db: Database
  ) {
    super();
  }

  async publish(
    message: OutboxMessage,
    { signal }: { signal: AbortSignal }
  ): Promise<void> {
    signal.throwIfAborted();
    const parsed = payloadSchema.safeParse(message.payload);
    if (!parsed.success || parsed.data.messageId !== message.id) {
      throw new NonRetryableMessageError('Invalid webhook outbox message');
    }
    const [webhook] = await this.db
      .select()
      .from(webhookMessageTable)
      .where(eq(webhookMessageTable.id, parsed.data.messageId));
    if (!webhook)
      throw new NonRetryableMessageError('Webhook message not found');
    if (webhook.status === 'success') return;

    signal.throwIfAborted();
    // BullMQ cannot cancel add(). Its stable job id makes a late success safe to retry.
    await this.queue.add(message.topic, webhook, {
      ...webhookJobOptions,
      jobId: webhook.id,
    });
    signal.throwIfAborted();
  }
}
