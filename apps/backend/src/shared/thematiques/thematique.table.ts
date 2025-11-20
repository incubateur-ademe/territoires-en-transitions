import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export const thematiqueTable = pgTable('thematique', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  mdId: varchar('md_id'),
});
