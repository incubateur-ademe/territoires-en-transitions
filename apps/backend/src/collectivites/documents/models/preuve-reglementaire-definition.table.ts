import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const preuveReglementaireDefinitionTable = pgTable(
  'preuve_reglementaire_definition',
  {
    id: varchar('id').primaryKey(),
    nom: text('nom').notNull(),
    description: text('description').notNull(),
  }
);

export type PreuveReglementaireDefinitionType = InferSelectModel<
  typeof preuveReglementaireDefinitionTable
>;
export type CreatePreuveReglementaireDefinitionType = InferInsertModel<
  typeof preuveReglementaireDefinitionTable
>;
export const preuveReglementaireDefinitionSchema = createSelectSchema(
  preuveReglementaireDefinitionTable
);
export const createPreuveReglementaireDefinitionSchema = createInsertSchema(
  preuveReglementaireDefinitionTable
);
