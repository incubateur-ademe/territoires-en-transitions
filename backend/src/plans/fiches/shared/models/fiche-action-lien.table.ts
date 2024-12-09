import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionLienTable = pgTable(
  'fiche_action_lien',
  {
    ficheUne: integer('fiche_une').references(() => ficheActionTable.id),
    ficheDeux: integer('fiche_deux').references(() => ficheActionTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheUne, table.ficheDeux] }),
    };
  }
);
