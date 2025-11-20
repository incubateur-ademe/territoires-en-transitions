import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { createdAt, createdBy } from '@tet/backend/utils/column.utils';
import { integer, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { axeTable } from './axe.table';

export const planReferentTable = pgTable(
  'plan_referent',
  {
    planId: integer('plan_id')
      .references(() => axeTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    tagId: integer('tag_id').references(() => personneTagTable.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').references(() => dcpTable.userId, {
      onDelete: 'cascade',
    }),
    createdAt,
    createdBy,
  },
  (table) => [
    uniqueIndex('plan_referent_axe_id_user_id_tag_id_key').on(
      table.planId,
      table.userId,
      table.tagId
    ),
  ]
);
