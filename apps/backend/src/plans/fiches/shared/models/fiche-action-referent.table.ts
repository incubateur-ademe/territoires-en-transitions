import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { integer, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionReferentTable = pgTable(
  'fiche_action_referent',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    tagId: integer('tag_id').references(() => personneTagTable.id),
    userId: uuid('user_id'), // references dcp
  },
  (table) => {
    return {
      ficheActionReferentFicheIdUserIdTagIdKey: uniqueIndex(
        'fiche_action_referent_fiche_id_user_id_tag_id_key '
      ).on(table.ficheId, table.userId, table.tagId),
    };
  }
);
