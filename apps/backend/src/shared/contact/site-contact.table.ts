import { modifiedAt } from '@tet/backend/utils/column.utils';
import { jsonb, pgTable, text } from 'drizzle-orm/pg-core';

/**
 * Journal des messages reçus via le formulaire de contact du site public.
 *
 * Pas de clé primaire côté base (cf. `data_layer/sqitch/deploy/site/contact.sql`) :
 * la table n'est jamais relue par l'application, elle sert de trace.
 */
export const siteContactTable = pgTable('site_contact', {
  modifiedAt,
  email: text('email').notNull(),
  formulaire: jsonb('formulaire').notNull(),
});
