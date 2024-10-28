import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { effetAttenduTable } from '../../taxonomie/models/effet-attendu.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionEffetAttenduTable = pgTable(
  'fiche_action_effet_attendu',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    effetAttenduId: integer('effet_attendu_id').references(
      () => effetAttenduTable.id
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.effetAttenduId] }),
    };
  }
);
