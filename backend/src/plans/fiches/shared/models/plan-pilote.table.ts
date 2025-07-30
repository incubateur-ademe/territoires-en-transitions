import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { createdAt, createdBy } from '@/backend/utils/column.utils';
import { integer, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { axeTable } from './axe.table';

export const planPiloteTable = pgTable(
  'plan_pilote',
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
    uniqueIndex('plan_pilote_axe_id_user_id_tag_id_key').on(
      table.planId,
      table.userId,
      table.tagId
    ),
  ]
);
