import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';
import { axeTable } from './axe.table';

export const ficheActionAxeTable = pgTable(
  'fiche_action_axe',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    axeId: integer('axe_id').references(() => axeTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.axeId] }),
    };
  },
);
