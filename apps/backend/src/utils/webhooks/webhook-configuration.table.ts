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
    // Reference unique de la configuration de webhook permettant d'identifier le système externe
    ref: text('ref').primaryKey().notNull(),
    // Type d'entité envoyé par le webhook
    entityType: text('entity_type').notNull(),
    // URL du système externe
    url: text('url').notNull(),
    // Type d'authentification utilisée pour envoyer le webhook
    authenticationMethod: text('authentication_method').notNull(),
    // Format du payload envoyé au système externe
    payloadFormat: text('payload_format').notNull().default('default'),
    // Clé de la variable d'environnement contenant le secret utilisé pour l'authentification
    secretKey: text('secret_key').notNull(), // TODO: use vault in supabase instead?
    createdAt,
    modifiedAt,
  }
);

export const webhookConfigurationSchema = createSelectSchema(
  webhookConfigurationTable,
  {
    entityType: z.enum(ApplicationSousScopes),
    authenticationMethod: z.enum(WebhookAuthenticationMethod),
    payloadFormat: z.enum(WebhookPayloadFormat),
  }
);

export type WebhookConfiguration = z.infer<typeof webhookConfigurationSchema>;

export const webhookConfigurationInsertSchema = createInsertSchema(
  webhookConfigurationTable
);

export type WebhookConfigurationInsert = z.infer<
  typeof webhookConfigurationInsertSchema
>;
