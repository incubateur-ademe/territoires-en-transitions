import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { axeTable } from './axe.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionAxeTable = pgTable(
  'fiche_action_axe',
  {
    ficheId: integer('fiche_id')
      .notNull()
      .references(() => ficheActionTable.id),
    axeId: integer('axe_id')
      .notNull()
      .references(() => axeTable.id),
  },
  (table) => [primaryKey({ columns: [table.ficheId, table.axeId] })]
);
