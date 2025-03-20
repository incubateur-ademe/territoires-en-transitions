import { actionRelationTable } from '@/backend/referentiels/index-domain';
import { InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { actionImpactTable } from './action-impact.table';

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
