import { createdAt, modifiedAt, version } from '@/backend/utils/column.utils';
import { boolean, pgTable, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { referentielIdPgEnum } from '../referentiel-id.column';
import { actionTypePgEnum, actionTypeSchema } from './action-type.enum';

export const referentielDefinitionTable = pgTable('referentiel_definition', {
  id: referentielIdPgEnum('id').primaryKey().notNull(),
  nom: varchar('nom', { length: 300 }).notNull(),
  version,
  hierarchie: actionTypePgEnum('hierarchie').array().notNull(),
  locked: boolean('locked').default(false),
  createdAt,
  modifiedAt,
});

export type ReferentielDefinition =
  typeof referentielDefinitionTable.$inferSelect;

export const referentielDefinitionSchema = createSelectSchema(
  referentielDefinitionTable,
  {
    hierarchie: actionTypeSchema.array(),
  }
);
