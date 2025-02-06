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
    referentielId: varchar('referentiel_id', { length: 30 })
      .references(() => referentielDefinitionTable.id)
      .notNull(),
    actionId: varchar('action_id', { length: 30 })
      .references(() => actionDefinitionTable.actionId)
      .notNull(),
    tagRef: varchar('tag_ref', { length: 300 }).notNull(),
  },
  (t) => [unique().on(t.referentielId, t.actionId, t.tagRef)]
);

export type ActionDefinitionTag = typeof actionDefinitionTagTable.$inferSelect;
export type ActionDefinitionTagInsert =
  typeof actionDefinitionTagTable.$inferInsert;

export const actionDefinitionTagSchema = createSelectSchema(
  actionDefinitionTagTable
);
export const actionDefinitionTagInsertSchema = createInsertSchema(
  actionDefinitionTagTable
);
