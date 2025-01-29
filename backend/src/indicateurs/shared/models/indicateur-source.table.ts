import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

export const indicateurSourceTable = pgTable('indicateur_source', {
  id: text('id').primaryKey(),
  libelle: text('libelle').notNull(),
  ordreAffichage: integer('ordre_affichage'),
});

export const indicateurSourceSchema = createSelectSchema(indicateurSourceTable);

export type Source = InferSelectModel<typeof indicateurSourceTable>;

export type SourceInsert = InferInsertModel<typeof indicateurSourceTable>;
