import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { referentielIdPgEnum } from '../referentiel-id.column';
import {
  actionDefinitionTable,
  actionIdVarchar,
} from './action-definition.table';

export const actionRelationTable = pgTable('action_relation', {
  id: varchar('id', { length: 30 })
    .references(() => actionDefinitionTable.actionId)
    .primaryKey()
    .notNull(),
  referentiel: referentielIdPgEnum('referentiel').notNull(),
  parent: varchar('parent', { length: 30 }).references(
    () => actionDefinitionTable.actionId
  ),
});

export const actionIdReference = actionIdVarchar.references(
  () => actionRelationTable.id
);
