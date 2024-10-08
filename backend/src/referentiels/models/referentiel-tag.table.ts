import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

/**
 * List of tags which can be used to categorize referentiel actions
 */
export const referentielTagTable = pgTable('referentiel_tag', {
  ref: varchar('ref', { length: 300 }).primaryKey(),
  nom: varchar('nom', { length: 300 }).notNull(),
  type: varchar('type', { length: 300 }).notNull(),
});

export type ReferentielTagType = InferSelectModel<typeof referentielTagTable>;
export type CreateReferentielTagType = InferInsertModel<
  typeof referentielTagTable
>;

export const referentielTagSchema = createSelectSchema(referentielTagTable);
export const createReferentielTagSchema =
  createInsertSchema(referentielTagTable);
