import { integer, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { personneTagTable } from '../../taxonomie/models/personne-tag.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionPiloteTable = pgTable(
  'fiche_action_pilote',
  {
    fiche_id: integer('fiche_id').references(() => ficheActionTable.id),
    tag_id: integer('tag_id').references(() => personneTagTable.id),
    user_id: uuid('user_id'), // references dcp
  },
  (table) => {
    return {
      one_user_per_fiche: uniqueIndex('one_user_per_fiche ').on(
        table.fiche_id,
        table.user_id,
      ),
      one_tag_per_fiche: uniqueIndex('one_tag_per_fiche ').on(
        table.fiche_id,
        table.tag_id,
      ),
    };
  },
);
