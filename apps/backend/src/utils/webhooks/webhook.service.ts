import { Injectable, Logger } from '@nestjs/common';
import { Outbox } from '@nestjs/outbox';
import { ApplicationSousScopesType } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { Transaction } from '../database/transaction.utils';
import { webhookConfigurationTable } from './webhook-configuration.table';
import { webhookMessageTable } from './webhook-message.table';

export type WebhookNotificationItem = {
  entityId: string;
  payload: unknown;
};

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly outbox: Outbox<Transaction>) {}

  async sendWebhookNotification(
    type: ApplicationSousScopesType,
    entityId: string,
    payload: unknown,
    tx: Transaction
  ): Promise<void> {
    await this.sendWebhookNotifications(type, [{ entityId, payload }], tx);
  }

  /** Persiste les messages et leur publication dans la transaction métier. */
  async sendWebhookNotifications(
    type: ApplicationSousScopesType,
    items: WebhookNotificationItem[],
    tx: Transaction
  ): Promise<void> {
    if (items.length === 0) return;

    const configurations = await tx
      .select()
      .from(webhookConfigurationTable)
      .where(eq(webhookConfigurationTable.entityType, type));
    if (!configurations.length) return;

    const messages = await tx
      .insert(webhookMessageTable)
      .values(
        configurations.flatMap((config) =>
          items.map((item) => ({
            status: 'pending',
            entityId: item.entityId,
            payload: item.payload,
            configurationRef: config.ref,
          }))
        )
      )
      .returning();

    await this.outbox.add(
      tx,
      messages.map((message) => ({
        id: message.id,
        topic: type,
        key: message.configurationRef,
        payload: { messageId: message.id },
      }))
    );
    this.logger.log(`Recorded ${messages.length} webhook messages`);
  }
}
