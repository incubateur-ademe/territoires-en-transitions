import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const banatic2025CompetenceTable = pgTable(
  'banatic_2025_competence',
  {
    competenceCode: integer('competence_code').primaryKey().notNull(),
    intitule: text('intitule').notNull(),
  }
);
