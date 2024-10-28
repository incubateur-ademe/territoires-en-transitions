import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { actionRelationTable } from '../../referentiel/models/action-relation.table';
import { actionImpactTable } from './action-impact.table';
import { text } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const actionImpactActionTable = pgTable(
  'action_impact_action',
  {
    actionImpactId: integer('action_impact_id')
      .notNull()
      .references(() => actionImpactTable.id),
    actionId: text('action_id')
      .notNull()
      .references(() => actionRelationTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.actionImpactId, table.actionId] }),
    };
  }
);

export type ActionImpactActionType = InferSelectModel<
  typeof actionImpactActionTable
>;
