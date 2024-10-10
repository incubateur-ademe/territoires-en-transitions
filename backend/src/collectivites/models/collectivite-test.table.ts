import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { collectiviteTable } from './collectivite.table';

export const collectiviteTestTable = pgTable('collectivite_test', {
  id: serial('id').primaryKey().notNull(),
  collectiviteId: integer('collectivite_id').references(
    () => collectiviteTable.id,
  ),
  nom: varchar('nom', { length: 300 }).notNull(),
});
