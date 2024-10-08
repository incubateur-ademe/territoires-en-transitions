import { InferSelectModel } from 'drizzle-orm';
import { pgTable, unique, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { actionDefinitionTable } from './action-definition.table';
import { referentielDefinitionTable } from './referentiel-definition.table';

/**
 * Relation between an action and a tag
 */
export const actionDefinitionTagTable = pgTable(
  'action_definition_tag',
  {
    referentiel_id: varchar('referentiel_id', { length: 30 })
      .references(() => referentielDefinitionTable.id)
      .notNull(),
    action_id: varchar('action_id', { length: 30 })
      .references(() => actionDefinitionTable.action_id)
      .notNull(),
    tag_ref: varchar('tag_ref', { length: 300 }).notNull(),
  },
  (t) => ({
    unq: unique().on(t.referentiel_id, t.action_id, t.tag_ref),
  })
);

export type ActionDefinitionTagType = InferSelectModel<
  typeof actionDefinitionTagTable
>;
export type CreateActionDefinitionTagType = InferSelectModel<
  typeof actionDefinitionTagTable
>;

export const actionDefinitionTagSchema = createSelectSchema(
  actionDefinitionTagTable
);
export const createActionDefinitionTagSchema = createInsertSchema(
  actionDefinitionTagTable
);
