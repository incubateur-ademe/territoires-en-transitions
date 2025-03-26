import { text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { ApplicationSousScopes } from '../application-domains.enum';
import { createdAt, modifiedAt } from '../column.utils';
import { WebhookAuthenticationMethod } from './webhook-authentication-method.enum';
import { WebhookPayloadFormat } from './webhook-payload-format.enum';
import { webhooksSchema } from './webhooks.schema';

export const webhookConfigurationTable = webhooksSchema.table(
  'webhook_configuration',
  {
    ref: text('ref').primaryKey().notNull(),
    entityType: text('entity_type').notNull(),
    url: text('url').notNull(),
    authenticationMethod: text('authentication_method').notNull(),
    payloadFormat: text('payload_format').notNull().default('default'),
    secretKey: text('secret_key').notNull(), // TODO: use vault in supabase instead?
    createdAt,
    modifiedAt,
  }
);

export const webhookConfigurationSchema = createSelectSchema(
  webhookConfigurationTable,
  {
    ref: (schema) =>
      schema.ref.describe(
        "Reference unique de la configuration de webhook permettant d'identifier le système externe"
      ),
    entityType: z
      .enum(ApplicationSousScopes)
      .describe("Type d'entité envoyé par le webhook"),
    url: (schema) => schema.url.describe('Url du système externe'),
    authenticationMethod: z
      .enum(WebhookAuthenticationMethod)
      .describe("Type d'authentification utilisée pour envoyer le webhook"),
    payloadFormat: z
      .enum(WebhookPayloadFormat)
      .describe(
        'Format du payload envoyé au système externe, default pour le format par défaut'
      ),
    secretKey: (schema) =>
      schema.secretKey.describe(
        "Clé de la variable d'environnement contenant le secret utilisé pour l'authentification"
      ),
  }
);

export type WebhookConfiguration = z.infer<typeof webhookConfigurationSchema>;

export const webhookConfigurationInsertSchema = createInsertSchema(
  webhookConfigurationTable
);

export type WebhookConfigurationInsert = z.infer<
  typeof webhookConfigurationInsertSchema
>;
