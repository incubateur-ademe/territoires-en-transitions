import { integer, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { personneTagTable } from '../../taxonomie/models/personne-tag.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionPiloteTable = pgTable(
  'fiche_action_pilote',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    tagId: integer('tag_id').references(() => personneTagTable.id),
    userId: uuid('user_id'), // references dcp
  },
  (table) => {
    return {
      oneUserPerFiche: uniqueIndex('one_user_per_fiche ').on(
        table.ficheId,
        table.userId,
      ),
      oneTagPerFiche: uniqueIndex('one_tag_per_fiche ').on(
        table.ficheId,
        table.tagId,
      ),
    };
  },
);
