import {
  integer,
  pgTable,
  primaryKey,
  varchar,
} from 'drizzle-orm/pg-core';
import { actionRelationTable } from '../../referentiel/models/action-relation.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionActionTable = pgTable(
  'fiche_action_action',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    actionId: varchar('action_id').references(() => actionRelationTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.actionId] }),
    };
  },
);
