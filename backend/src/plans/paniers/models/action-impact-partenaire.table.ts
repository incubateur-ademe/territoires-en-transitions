import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { actionImpactTable } from './action-impact.table';
import { panierPartenaireTable } from './panier-partenaire.table';

export const actionImpactPartenaireTable = pgTable(
  'action_impact_partenaire',
  {
    actionImpactId: integer('action_impact_id')
      .notNull()
      .references(() => actionImpactTable.id),
    partenaireId: integer('partenaire_id')
      .notNull()
      .references(() => panierPartenaireTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.actionImpactId, table.partenaireId],
      }),
    };
  }
);
