import { integer, jsonb, text, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { createdAt, modifiedAt } from '../column.utils';
import { webhookConfigurationTable } from './webhook-configuration.table';
import { WebhookStatus } from './webhook-status.enum';
import { webhooksSchema } from './webhooks.schema';

export const webhookMessageTable = webhooksSchema.table('webhook_message', {
  // Message id utilisé pour identifier le webhook message
  id: uuid('id').primaryKey().defaultRandom(),

  configurationRef: text('configuration_ref')
    .notNull()
    .references(() => webhookConfigurationTable.ref),
  // Payload correspondant à l'entité modifiée
  payload: jsonb('payload').notNull(),
  // Payload envoyée au système externe (transformée si format différent de standard)
  sentPayload: jsonb('sent_payload'),
  // Identifiant de l'entité modifiée
  entityId: text('entity_id').notNull(),
  response: jsonb('response'),
  // Identifiant dans le système externe si renvoyé par le système externe lors de l'envoi du webhook
  entityExternalId: text('entity_external_id'),
  // Le message a-t-il été correctement envoyé ?
  status: text('status').notNull(),
  // Message d'erreur si le webhook n'a pas pu être envoyé
  error: text('error'),
  // Nombre de tentatives d'envoi du webhook (0 si pas encore envoyé)
  retryCount: integer('retry_count').notNull().default(0),
  createdAt,
  modifiedAt,
});

export const webhookMessageSchema = createSelectSchema(webhookMessageTable, {
  status: z.enum(WebhookStatus),
});

export type WebhookMessage = z.infer<typeof webhookMessageSchema>;

export const webhookMessageInsertSchema = createInsertSchema(
  webhookMessageTable
).extend({
  status: z.enum(WebhookStatus),
});

export type WebhookMessageInsert = z.infer<typeof webhookMessageInsertSchema>;
