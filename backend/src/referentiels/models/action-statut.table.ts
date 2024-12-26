import { modifiedAt, modifiedBy } from '@/domain/utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { actionIdReference } from './action-definition.table';

export const avancementEnum = pgEnum('avancement', [
  'fait',
  'pas_fait',
  'programme',
  'non_renseigne',
  'detaille',
]);

export const actionStatutTable = pgTable('action_statut', {
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  actionId: actionIdReference.notNull(),
  avancement: avancementEnum('avancement').notNull(),
  avancementDetaille: doublePrecision('avancement_detaille').array(),
  concerne: boolean('concerne').notNull(),
  modifiedBy,
  modifiedAt,
});

export type ActionStatutType = InferSelectModel<typeof actionStatutTable>;
export type CreateActionStatutTypeType = InferInsertModel<
  typeof actionStatutTable
>;

export const actionStatutSchema = createSelectSchema(actionStatutTable);
export const createActionStatutSchema = createInsertSchema(actionStatutTable);
