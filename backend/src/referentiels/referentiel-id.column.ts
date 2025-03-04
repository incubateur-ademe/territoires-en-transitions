import { varchar } from 'drizzle-orm/pg-core';
import { referentielDefinitionTable } from './models/referentiel-definition.table';

export const referentielId = {
  referentielId: varchar('referentiel_id', { length: 30 })
    .notNull()
    .references(() => referentielDefinitionTable.id),
};
