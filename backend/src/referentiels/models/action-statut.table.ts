import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../collectivites/models/collectivite.models';
import { actionIdReference } from './action-definition.table';

export const avancementEnum = pgEnum('avancement', [
  'fait',
  'pas_fait',
  'programme',
  'non_renseigne',
  'detaille',
]);

export const actionStatutTable = pgTable('action_statut', {
  collectivite_id: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  action_id: actionIdReference.notNull(),
  avancement: avancementEnum('avancement').notNull(),
  avancement_detaille: doublePrecision('avancement_detaille').array(),
  concerne: boolean('concerne').notNull(),
  modified_by: uuid('modified_by')
    .default(sql`auth.uid()`)
    .notNull(),
  modified_at: timestamp('modified_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type ActionStatutType = InferSelectModel<typeof actionStatutTable>;
export type CreateActionStatutTypeType = InferInsertModel<
  typeof actionStatutTable
>;

export const actionStatutSchema = createSelectSchema(actionStatutTable);
export const createActionStatutSchema = createInsertSchema(actionStatutTable);
