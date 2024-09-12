import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';
import { thematiqueTable } from 'backend/src/taxonomie/models/thematique.table';

export const ficheActionSousThematiqueTable = pgTable(
  'fiche_action_sous_thematique',
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
