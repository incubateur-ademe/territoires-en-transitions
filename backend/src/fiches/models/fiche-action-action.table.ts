import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { ficheActionTable } from '../../plans/fiches/shared/models/fiche-action.table';
import { actionRelationTable } from '../../referentiels/models/action-relation.table';

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
  }
);
