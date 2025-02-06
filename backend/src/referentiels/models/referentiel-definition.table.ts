import { createdAt, modifiedAt } from '@/domain/utils';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { actionTypePgEnum } from './action-type.enum';

export const referentielIdVarchar = varchar('referentiel_id', { length: 30 });

export const referentielDefinitionTable = pgTable('referentiel_definition', {
  id: varchar('id', { length: 30 }).primaryKey().notNull(),
  nom: varchar('nom', { length: 300 }).notNull(),
  version: varchar('version', { length: 16 }).notNull().default('1.0.0'),
  hierarchie: actionTypePgEnum('hierarchie').array().notNull(),
  createdAt,
  modifiedAt,
});

export type ReferentielDefinition =
  typeof referentielDefinitionTable.$inferSelect;

export const referentielDefinitionSchema = createSelectSchema(
  referentielDefinitionTable
);
