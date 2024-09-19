import { integer, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { personneTagTable } from '../../taxonomie/models/personne-tag.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionReferentTable = pgTable(
  'fiche_action_referent',
  {
    fiche_id: integer('fiche_id').references(() => ficheActionTable.id),
    tag_id: integer('tag_id').references(() => personneTagTable.id),
    user_id: uuid('user_id'), // references dcp
  },
  (table) => {
    return {
      fiche_action_referent_fiche_id_user_id_tag_id_key: uniqueIndex(
        'fiche_action_referent_fiche_id_user_id_tag_id_key ',
      ).on(table.fiche_id, table.user_id, table.tag_id),
    };
  },
);
