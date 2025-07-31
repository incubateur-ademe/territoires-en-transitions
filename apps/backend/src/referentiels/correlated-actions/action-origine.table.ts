import { doublePrecision, pgTable, unique, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { actionDefinitionTable } from '../models/action-definition.table';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';

/**
 * Track relation between how one action from a referentiel is related to another action from another referentiel
 */
export const actionOrigineTable = pgTable(
  'action_origine',
  {
    referentielId: varchar('referentiel_id', { length: 30 })
      .references(() => referentielDefinitionTable.id)
      .notNull(),
    actionId: varchar('action_id', { length: 30 })
      .references(() => actionDefinitionTable.actionId)
      .notNull(),
    origineReferentielId: varchar('origine_referentiel_id', {
      length: 30,
    })
      .references(() => referentielDefinitionTable.id)
      .notNull(),
    origineActionId: varchar('origine_action_id', { length: 30 })
      .references(() => actionDefinitionTable.actionId)
      .notNull(),
    ponderation: doublePrecision('ponderation').notNull().default(1),
  },
  (t) => ({
    unq: unique().on(
      t.referentielId,
      t.actionId,
      t.origineReferentielId,
      t.origineActionId
    ),
  })
);

export type ActionOrigine = typeof actionOrigineTable.$inferSelect;
export type ActionOrigineInsert = typeof actionOrigineTable.$inferInsert;

export const actionOrigineSchema = createSelectSchema(actionOrigineTable);
export const actionOrigineInsertSchema = createInsertSchema(actionOrigineTable);
