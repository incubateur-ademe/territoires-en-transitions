import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import {
  collectiviteTable,
  serviceTagTable,
} from '../../collectivites/index-domain';
import { actionRelationTable } from './action-relation.table';

export const actionServiceTable = pgTable(
  'action_service',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    actionId: varchar('action_id', { length: 30 })
      .references(() => actionRelationTable.id)
      .notNull(),
    serviceTagId: integer('service_tag_id')
      .references(() => serviceTagTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.collectiviteId, table.actionId],
    }),
  ]
);
