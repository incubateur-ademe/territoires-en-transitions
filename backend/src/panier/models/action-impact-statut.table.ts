import { integer, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { actionImpactTable } from './action-impact.table';
import { InferSelectModel } from 'drizzle-orm';
import { panierTable } from './panier.table';
import { actionImpactCategorieTable } from './action-impact-categorie.table';
import { createSelectSchema } from 'drizzle-zod';

export const actionImpactStatutTable = pgTable(
  'action_impact_statut',
  {
    panierId: uuid('panier_id')
      .notNull()
      .references(() => panierTable.id),
    actionId: integer('action_id')
      .notNull()
      .references(() => actionImpactTable.id),
    categorieId: text('categorie_id')
      .notNull()
      .references(() => actionImpactCategorieTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.panierId, table.actionId] }),
    };
  }
);
export type ActionImpactStatutType = InferSelectModel<
  typeof actionImpactStatutTable
>;
export const actionImpactStatutSchema = createSelectSchema(
  actionImpactStatutTable
);
