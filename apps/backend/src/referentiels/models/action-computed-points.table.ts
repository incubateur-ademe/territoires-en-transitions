import { modifiedAt } from '@tet/backend/utils/column.utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { doublePrecision, pgTable } from 'drizzle-orm/pg-core';
import { actionIdReference } from './action-relation.table';

export const actionComputedPointsTable = pgTable('action_computed_points', {
  modifiedAt,
  actionId: actionIdReference.primaryKey().notNull(),
  value: doublePrecision('value').notNull(),
});

export type ActionComputedPointsType = InferSelectModel<
  typeof actionComputedPointsTable
>;
export type CreateActionComputedPointsType = InferInsertModel<
  typeof actionComputedPointsTable
>;
