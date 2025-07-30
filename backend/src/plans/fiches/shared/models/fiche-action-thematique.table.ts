import { thematiqueTable } from '@/backend/shared/thematiques/thematique.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

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
