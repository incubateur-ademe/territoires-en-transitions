import { pgTable, text } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const actionImpactCategorieTable = pgTable('action_impact_categorie', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
});
export type ActionImpactCategorieType = InferSelectModel<
  typeof actionImpactCategorieTable
>;
