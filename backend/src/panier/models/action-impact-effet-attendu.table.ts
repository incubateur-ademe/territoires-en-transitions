import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { effetAttenduTable } from '../../taxonomie/models/effet-attendu.table';
import { actionImpactTable } from './action-impact.table';
import { InferSelectModel } from 'drizzle-orm';

export const actionImpactEffetAttenduTable = pgTable(
  'action_impact_effet_attendu',
  {
    actionImpactId: integer('action_impact_id')
      .notNull()
      .references(() => actionImpactTable.id),
    effetAttenduId: integer('effet_attendu_id')
      .notNull()
      .references(() => effetAttenduTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.actionImpactId, table.effetAttenduId],
      }),
    };
  },
);
export type ActionImpactEffetAttenduType = InferSelectModel<
  typeof actionImpactEffetAttenduTable
>;
