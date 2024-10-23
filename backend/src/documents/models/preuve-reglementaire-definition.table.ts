import { pgTable, text, varchar } from 'drizzle-orm/pg-core';

export const preuveReglementaireDefinitionTable = pgTable(
  'preuve_reglementaire_definition',
  {
    id: varchar('id').primaryKey(),
    nom: text('nom').notNull(),
    description: text('description').notNull(),
  }
);
