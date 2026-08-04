import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { createdAt, createdBy } from '@tet/backend/utils/column.utils';
import {
  index,
  integer,
  pgTable,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { demarcheTable } from './demarche.table';

export const demarchePiloteTable = pgTable(
  'demarche_pilote',
  {
    demarcheId: integer('demarche_id')
      .references(() => demarcheTable.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: integer('tag_id').references(() => personneTagTable.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').references(() => dcpTable.id, {
      onDelete: 'cascade',
    }),
    createdAt,
    createdBy,
  },
  (table) => [
    // NULLS NOT DISTINCT côté SQL (cf. migration) : l'unicité s'applique
    // malgré le NULL systématique sur tag_id ou user_id.
    uniqueIndex('demarche_pilote_demarche_id_user_id_tag_id_key').on(
      table.demarcheId,
      table.userId,
      table.tagId
    ),
    index('demarche_pilote_tag_id_idx').on(table.tagId),
    index('demarche_pilote_user_id_idx').on(table.userId),
  ]
);
