import { integer, serial, text } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.models';

export const TagBase = {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  collectivite_id: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
};
