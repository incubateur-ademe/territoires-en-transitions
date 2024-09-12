import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import {
  actionDefinitionTable,
  referentielEnum,
} from './action-definition.table';

export const actionRelationTable = pgTable('action_relation', {
  id: varchar('id', { length: 30 })
    .references(() => actionDefinitionTable.actionId)
    .primaryKey()
    .notNull(),
  referentiel: referentielEnum('referentiel').notNull(),
  parent: varchar('parent', { length: 30 }).references(
    () => actionDefinitionTable.actionId,
  ),
});

export type ActionRelationType = InferSelectModel<typeof actionRelationTable>;
export type CreateActionRelationType = InferInsertModel<
  typeof actionRelationTable
>;

export const actionRelationSchema = createSelectSchema(actionRelationTable);
export const createActionRelationSchema =
  createInsertSchema(actionRelationTable);
