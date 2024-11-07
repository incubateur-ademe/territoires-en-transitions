import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { tagTableBase } from './tag.table-base';

export const categorieTagTable = pgTable('categorie_tag', {
  ...tagTableBase,
  groupementId: integer('groupement_id'), // TODO .references(() => groupementTable.id)
  visible: boolean('visible').default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid('created_by'), // TODO references auth.uid
});
