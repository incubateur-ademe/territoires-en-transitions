import { text } from 'drizzle-orm/pg-core';
import { createdAt, modifiedAt } from '../column.utils';
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
