import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { referentielIdPgEnum } from '../referentiel-id.column';
import {
  actionDefinitionTable,
  actionIdVarchar,
} from './action-definition.table';

export const actionRelationTable = pgTable('action_relation', {
  id: varchar('id', { length: 30 })
    .references(() => actionDefinitionTable.actionId)
    .primaryKey()
    .notNull(),
  referentiel: referentielIdPgEnum('referentiel').notNull(),
  parent: varchar('parent', { length: 30 }).references(
    () => actionDefinitionTable.actionId
  ),
});

export type ActionRelation = InferSelectModel<typeof actionRelationTable>;
export type ActionRelationInsert = InferInsertModel<typeof actionRelationTable>;

export const actionRelationSchema = createSelectSchema(actionRelationTable);
export const actionRelationInsertSchema =
  createInsertSchema(actionRelationTable);

export const actionIdReference = actionIdVarchar.references(
  () => actionRelationTable.id
);
