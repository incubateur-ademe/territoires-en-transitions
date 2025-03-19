import { createdAt, modifiedAt } from '@/backend/utils/index-domain';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { actionTypePgEnum } from './action-type.enum';
import { referentielIdPgEnum } from './referentiel-id.enum';

export const referentielDefinitionTable = pgTable('referentiel_definition', {
  // Not really a PG Enum but this allow correct typing
  id: referentielIdPgEnum('id').primaryKey().notNull(),
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
