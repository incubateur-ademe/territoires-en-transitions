import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const banaticCompetenceTable = pgTable('banatic_competence', {
  code: integer('code').primaryKey().notNull(),
  nom: text('nom').notNull(),
});
