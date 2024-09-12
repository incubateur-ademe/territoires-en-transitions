import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const indicateurSourceTable = pgTable('indicateur_source', {
  id: text('id').primaryKey(),
  libelle: text('libelle').notNull(),
  ordreAffichage: integer('ordre_affichage'),
});
export type IndicateurSourceType = InferSelectModel<
  typeof indicateurSourceTable
>;
export type CreateIndicateurSourceType = InferInsertModel<
  typeof indicateurSourceTable
>;
