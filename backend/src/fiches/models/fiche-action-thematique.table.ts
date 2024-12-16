import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from '../../plans/fiches/shared/models/fiche-action.table';
import { thematiqueTable } from '../../shared/models/thematique.table';

export const ficheActionThematiqueTable = pgTable(
  'fiche_action_thematique',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    thematiqueId: integer('thematique_id').references(() => thematiqueTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.thematiqueId] }),
    };
  }
);
