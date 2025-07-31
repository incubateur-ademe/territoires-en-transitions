import { integer, jsonb, text, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { createdAt, modifiedAt } from '../column.utils';
import { webhookConfigurationTable } from './webhook-configuration.table';
import { WebhookStatus } from './webhook-status.enum';
import { webhooksSchema } from './webhooks.schema';

export const webhookMessageTable = webhooksSchema.table('webhook_message', {
  id: uuid('id').primaryKey().defaultRandom(),

  configurationRef: text('configuration_ref')
    .notNull()
    .references(() => webhookConfigurationTable.ref),
  payload: jsonb('payload').notNull(),
  sentPayload: jsonb('sent_payload'),
  entityId: text('entity_id').notNull(),
  response: jsonb('response'),
  entityExternalId: text('entity_external_id'),
  status: text('status').notNull(),
  error: text('error'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt,
  modifiedAt,
});

export const webhookMessageSchema = createSelectSchema(webhookMessageTable, {
  status: z
    .enum(WebhookStatus)
    .describe('Le message a-t-il été correctement envoyé ?'),
  id: (schema) =>
    schema.id.describe('Message id utilisé pour identifier le webhook message'),
  payload: (schema) =>
    schema.payload.describe("Payload correspondant à l'entité modifiée"),
  sentPayload: (schema) =>
    schema.sentPayload.describe(
      'Payload envoyée au système externe (transformée si format différent de standard)'
    ),
  entityId: (schema) =>
    schema.entityId.describe("Identifiant de l'entité modifiée"),
  entityExternalId: (schema) =>
    schema.entityExternalId.describe(
      "Identifiant dans le système externe si renvoyé par le système externe lors de l'envoi du webhook"
    ),
  error: (schema) =>
    schema.error.describe(
      "Message d'erreur si le webhook n'a pas pu être envoyé"
    ),
  retryCount: (schema) =>
    schema.retryCount.describe(
      "Nombre de tentatives d'envoi du webhook (0 si pas encore envoyé)"
    ),
});

export type WebhookMessage = z.infer<typeof webhookMessageSchema>;

export const webhookMessageInsertSchema = createInsertSchema(
  webhookMessageTable
).extend({
  status: z.enum(WebhookStatus),
});

export type WebhookMessageInsert = z.infer<typeof webhookMessageInsertSchema>;
