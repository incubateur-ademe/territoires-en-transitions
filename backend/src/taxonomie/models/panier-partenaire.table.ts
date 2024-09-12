import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const panierPartenaireTable = pgTable('panier_partenaire', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
});
export type PanierPartenaireType = InferSelectModel<
  typeof panierPartenaireTable
>;
