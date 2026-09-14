import { createdAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
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
    createdAt,
    // Pas de defaut auth.uid() : renseigné obligatoirement par l'application
    // (le backend n'utilise pas la connexion Supabase authentifiée).
    createdBy: uuid('created_by').notNull(),
  },
  (table) => [primaryKey({ columns: [table.ficheId, table.axeId] })]
);
