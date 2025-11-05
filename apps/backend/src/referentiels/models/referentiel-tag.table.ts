import { pgTable, varchar } from 'drizzle-orm/pg-core';

/**
 * List of tags which can be used to categorize referentiel actions
 */
export const referentielTagTable = pgTable('referentiel_tag', {
  ref: varchar('ref', { length: 300 }).primaryKey(),
  nom: varchar('nom', { length: 300 }).notNull(),
  type: varchar('type', { length: 300 }).notNull(),
});
