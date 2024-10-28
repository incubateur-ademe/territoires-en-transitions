import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { TagBase } from './tag.basetable';

export const categorieTagTable = pgTable('categorie_tag', {
  ...TagBase,
  groupementId: integer('groupement_id'), // TODO .references(() => groupementTable.id)
  visible: boolean('visible').default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid('created_by'), // TODO references auth.uid
});
