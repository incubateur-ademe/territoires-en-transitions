import { createdAt, modifiedAt, version } from '@/backend/utils/column.utils';
import { boolean, pgTable, varchar } from 'drizzle-orm/pg-core';
import { referentielIdPgEnum } from '../referentiel-id.column';
import { actionTypePgEnum } from './action-type.column';

export const referentielDefinitionTable = pgTable('referentiel_definition', {
  id: referentielIdPgEnum('id').primaryKey().notNull(),
  nom: varchar('nom', { length: 300 }).notNull(),
  version,
  hierarchie: actionTypePgEnum('hierarchie').array().notNull(),
  locked: boolean('locked').default(false),
  createdAt,
  modifiedAt,
});
