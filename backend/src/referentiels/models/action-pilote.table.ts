import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { actionRelationTable } from './action-relation.table';

export const actionPiloteTable = pgTable(
  'action_pilote',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    actionId: varchar('action_id', { length: 30 })
      .references(() => actionRelationTable.id)
      .notNull(),
    tagId: integer('tag_id').references(() => personneTagTable.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').references(() => dcpTable.userId, {
      onDelete: 'cascade',
    }),
  },
  (table) => [
    uniqueIndex('one_user_per_action').on(
      table.collectiviteId,
      table.actionId,
      table.userId
    ),
    uniqueIndex('one_tag_per_action').on(
      table.collectiviteId,
      table.actionId,
      table.tagId
    ),
    check(
      'either_user_or_tag_not_null',
      sql`${table.userId} IS NOT NULL OR ${table.tagId} IS NOT NULL`
    ),
  ]
);
