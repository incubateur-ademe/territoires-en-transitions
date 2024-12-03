import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { doublePrecision, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { actionIdReference } from './action-definition.table';

export const actionComputedPointsTable = pgTable('action_computed_points', {
  modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  actionId: actionIdReference.primaryKey().notNull(),
  value: doublePrecision('value').notNull(),
});

export type ActionComputedPointsType = InferSelectModel<
  typeof actionComputedPointsTable
>;
export type CreateActionComputedPointsType = InferInsertModel<
  typeof actionComputedPointsTable
>;

export const actionComputedPointsSchema = createSelectSchema(
  actionComputedPointsTable
);
export const createActionComputedPointsSchema = createInsertSchema(
  actionComputedPointsTable
);
