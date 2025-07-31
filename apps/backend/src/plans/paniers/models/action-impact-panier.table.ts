import { integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { actionImpactTable } from './action-impact.table';
import { panierTable } from './panier.table';

export const actionImpactPanierTable = pgTable(
  'action_impact_panier',
  {
    panierId: uuid('panier_id')
      .notNull()
      .references(() => panierTable.id),
    actionId: integer('action_id')
      .notNull()
      .references(() => actionImpactTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.panierId, table.actionId] }),
    };
  }
);
