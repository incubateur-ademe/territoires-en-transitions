import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';
import { sousThematiqueTable } from '../../taxonomie/models/sous-thematique.table';

export const ficheActionSousThematiqueTable = pgTable(
  'fiche_action_sous_thematique',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    thematiqueId: integer('thematique_id').references(
      () => sousThematiqueTable.id
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.thematiqueId] }),
    };
  }
);
