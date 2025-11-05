import { integer, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { actionImpactCategorieTable } from './action-impact-categorie.table';
import { actionImpactTable } from './action-impact.table';
import { panierTable } from './panier.table';

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
  (table) => [primaryKey({ columns: [table.panierId, table.actionId] })]
);
