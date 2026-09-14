import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionReferentTable = pgTable(
  'fiche_action_referent',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    tagId: integer('tag_id').references(() => personneTagTable.id),
    userId: uuid('user_id'), // references dcp
    createdAt,
    // Pas de defaut auth.uid() : renseigné obligatoirement par l'application
    // (le backend n'utilise pas la connexion Supabase authentifiée).
    createdBy: uuid('created_by').notNull(),
  },
  (table) => {
    return {
      ficheActionReferentFicheIdUserIdTagIdKey: uniqueIndex(
        'fiche_action_referent_fiche_id_user_id_tag_id_key '
      ).on(table.ficheId, table.userId, table.tagId),
    };
  }
);
