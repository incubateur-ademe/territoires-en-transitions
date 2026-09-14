import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionThematiqueTable = pgTable(
  'fiche_action_thematique',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    thematiqueId: integer('thematique_id').references(() => thematiqueTable.id),
    createdAt,
    // Pas de defaut auth.uid() : renseigné obligatoirement par l'application
    // (le backend n'utilise pas la connexion Supabase authentifiée).
    createdBy: uuid('created_by').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.thematiqueId] }),
    };
  }
);
