import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { thematiqueTable } from './thematique.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionThematiqueTable = pgTable(
  'fiche_action_thematique',
  {
    fiche_id: integer('fiche_id').references(() => ficheActionTable.id),
    thematique_id: integer('thematique_id').references(
      () => thematiqueTable.id
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.fiche_id, table.thematique_id] }),
    };
  }
);
