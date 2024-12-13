import { createdAt, modifiedAt } from '@/backend/utils';
import { InferSelectModel } from 'drizzle-orm';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { actionTypeEnum } from './action-type.enum';

export const referentielIdVarchar = varchar('referentiel_id', { length: 30 });

export const referentielDefinitionTable = pgTable('referentiel_definition', {
  id: varchar('id', { length: 30 }).primaryKey().notNull(),
  nom: varchar('nom', { length: 300 }).notNull(),
  version: varchar('version', { length: 16 }).notNull().default('1.0.0'),
  hierarchie: actionTypeEnum('hierarchie').array().notNull(),
  createdAt,
  modifiedAt,
});

export type ReferentielDefinitionType = InferSelectModel<
  typeof referentielDefinitionTable
>;
export type CreateRefentielDefinitionType = InferSelectModel<
  typeof referentielDefinitionTable
>;

export const referentielDefinitionSchema = createSelectSchema(
  referentielDefinitionTable
);
export const createReferentielDefinitionSchema = createInsertSchema(
  referentielDefinitionTable
);
