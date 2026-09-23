import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const actionImpactFourchetteBudgetaireTable = pgTable(
  'action_impact_fourchette_budgetaire',
  {
    niveau: serial('niveau').primaryKey(),
    nom: text('nom').notNull(),
  }
);
export type ActionImpactFourchetteBudgetaireType = InferSelectModel<
  typeof actionImpactFourchetteBudgetaireTable
>;
