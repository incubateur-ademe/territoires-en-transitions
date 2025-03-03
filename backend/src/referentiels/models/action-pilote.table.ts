import {
  check,
  integer,
  uuid,
  pgTable,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import {
  collectiviteTable,
  personneTagTable,
} from '../../collectivites/index-domain';
import { sql } from 'drizzle-orm';
import { actionRelationTable } from './action-relation.table';
import { dcpTable } from '../../auth/index-domain';

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
  (table) => {
    return {
      oneUserPerAction: uniqueIndex('one_user_per_action').on(
        table.collectiviteId,
        table.actionId,
        table.userId
      ),
      oneTagPerAction: uniqueIndex('one_tag_per_action').on(
        table.collectiviteId,
        table.actionId,
        table.tagId
      ),
      eitherUserOrTagNotNull: check(
        'either_user_or_tag_not_null',
        sql`${table.userId} IS NOT NULL OR ${table.tagId} IS NOT NULL`
      ),
    };
  }
);
