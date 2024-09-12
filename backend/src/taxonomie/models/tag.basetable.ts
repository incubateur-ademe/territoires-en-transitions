import { integer, serial, text } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.table';

export const TagBase = {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
};
