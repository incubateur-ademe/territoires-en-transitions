import { actionIdVarchar } from '@tet/backend/referentiels/models/action-definition.table';
import {
  createdAt,
  modifiedAt,
  SQL_AUTH_UID,
} from '@tet/backend/utils/column.utils';
import { discussionStatusValues } from '@tet/domain/collectivites';
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  uuid,
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const discussionStatusPgEnum = pgEnum(
  'discussion_statut',
  discussionStatusValues
);

// ============================================================================
// DATABASE TABLES
// ============================================================================

export const discussionTable = pgTable('discussion', {
  id: serial('id').primaryKey().notNull(),
  collectiviteId: integer('collectivite_id').notNull(),
  actionId: actionIdVarchar.notNull(),
  status: discussionStatusPgEnum('status').notNull(),
  createdBy: uuid('created_by').default(SQL_AUTH_UID).notNull(),
  createdAt,
  modifiedAt,
});

export const discussionMessageTable = pgTable('discussion_message', {
  id: serial('id').primaryKey(),
  discussionId: integer('discussion_id').notNull(),
  message: text('message').notNull(),
  createdBy: uuid('created_by').default(SQL_AUTH_UID).notNull(),
  createdAt,
});
