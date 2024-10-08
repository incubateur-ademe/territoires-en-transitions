import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { doublePrecision, pgTable, unique, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { actionDefinitionTable } from './action-definition.table';
import { referentielDefinitionTable } from './referentiel-definition.table';

/**
 * Track relation between how one action from a referentiel is related to another action from another referentiel
 */
export const actionOrigineTable = pgTable(
  'action_origine',
  {
    referentiel_id: varchar('referentiel_id', { length: 30 })
      .references(() => referentielDefinitionTable.id)
      .notNull(),
    action_id: varchar('action_id', { length: 30 })
      .references(() => actionDefinitionTable.action_id)
      .notNull(),
    origine_referentiel_id: varchar('origine_referentiel_id', {
      length: 30,
    })
      .references(() => referentielDefinitionTable.id)
      .notNull(),
    origine_action_id: varchar('origine_action_id', { length: 30 })
      .references(() => actionDefinitionTable.action_id)
      .notNull(),
    ponderation: doublePrecision('ponderation').notNull().default(1),
  },
  (t) => ({
    unq: unique().on(
      t.referentiel_id,
      t.action_id,
      t.origine_referentiel_id,
      t.origine_action_id
    ),
  })
);

export type ActionOrigineType = InferSelectModel<typeof actionOrigineTable>;
export type CreateActionOrigineType = InferInsertModel<
  typeof actionOrigineTable
>;

export const actionOrigineSchema = createSelectSchema(actionOrigineTable);
export const createActionOrigineSchema = createInsertSchema(actionOrigineTable);
