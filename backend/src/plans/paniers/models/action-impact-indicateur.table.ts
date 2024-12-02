import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { actionImpactTable } from './action-impact.table';
import { indicateurDefinitionTable } from '../../indicateurs/models/indicateur-definition.table';
import { InferSelectModel } from 'drizzle-orm';

export const actionImpactIndicateurTable = pgTable(
  'action_impact_indicateur',
  {
    actionImpactId: integer('action_impact_id')
      .notNull()
      .references(() => actionImpactTable.id),
    indicateurId: integer('indicateur_id')
      .notNull()
      .references(() => indicateurDefinitionTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.actionImpactId, table.indicateurId],
      }),
    };
  }
);
export type ActionImpactIndicateurType = InferSelectModel<
  typeof actionImpactIndicateurTable
>;
