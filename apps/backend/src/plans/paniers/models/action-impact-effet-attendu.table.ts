import { effetAttenduTable } from '@tet/backend/shared/effet-attendu/effet-attendu.table';
import { InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { actionImpactTable } from './action-impact.table';

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
  }
);
export type ActionImpactEffetAttenduType = InferSelectModel<
  typeof actionImpactEffetAttenduTable
>;
