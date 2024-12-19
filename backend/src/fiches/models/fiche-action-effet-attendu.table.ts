import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from '../../plans/fiches/shared/models/fiche-action.table';
import { effetAttenduTable } from '../../shared/models/effet-attendu.table';

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
