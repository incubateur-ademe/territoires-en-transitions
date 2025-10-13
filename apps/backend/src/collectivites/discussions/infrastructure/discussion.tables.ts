import { actionIdVarchar } from '@/backend/referentiels/models/action-definition.table';
import {
  createdAt,
  modifiedAt,
  SQL_AUTH_UID,
} from '@/backend/utils/column.utils';
import { InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, serial, text, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { discussionStatusPgEnum } from '../domain/discussion.types';

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

export type DiscussionType = InferSelectModel<typeof discussionTable>;

export type CreateDiscussionType = Omit<DiscussionType, 'id'>;

export const discussionMessageTable = pgTable('discussion_message', {
  id: serial('id').primaryKey(),
  discussionId: integer('discussion_id').notNull(),
  message: text('message').notNull(),
  createdBy: uuid('created_by').default(SQL_AUTH_UID).notNull(),
  createdAt,
});

export type CreateDiscussionMessageType = {
  discussionId: number;
  message: string;
  createdBy: string;
  createdAt: string;
};

export const discussionMessageSchema = createSelectSchema(
  discussionMessageTable
);
export const createDiscussionMessageSchema = createInsertSchema(
  discussionMessageTable
);
