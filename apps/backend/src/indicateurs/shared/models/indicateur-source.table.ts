import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const indicateurSourceTable = pgTable('indicateur_source', {
  id: text('id').primaryKey(),
  libelle: text('libelle').notNull(),
  ordreAffichage: integer('ordre_affichage'),
});
