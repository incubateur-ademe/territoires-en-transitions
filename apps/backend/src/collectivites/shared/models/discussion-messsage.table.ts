import { createdAt, createdBy } from '@/backend/utils/column.utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { discussionTable } from '@/backend/collectivites/shared/models/discussion.table';
import { authUsersTable } from '@/backend/users/models/auth-users.table';

export const discussionMessageTable = pgTable(
  'discussion_message',
  {
    id: serial('id').primaryKey(),
    discussionId: integer('discussion_id').notNull(),
    message: text('message').notNull(),
    createdBy,
    createdAt,
  },
  (table) => {
    return {
      discussionMessageDiscussionIdFkey: foreignKey({
        columns: [table.discussionId],
        foreignColumns: [discussionTable.id],
        name: 'discussion_message_discussion_id_fkey',
      }),
      discussionMessageCreatedByFkey: foreignKey({
        columns: [table.createdBy],
        foreignColumns: [authUsersTable.id],
        name: 'discussion_message_created_by_fkey',
      }),
    };
  }
);

export type DiscussionMessageType = InferSelectModel<
  typeof discussionMessageTable
>;
export type CreateDiscussionMessageTypeType = InferInsertModel<
  typeof discussionMessageTable
>;

export const discussionMessageSchema = createSelectSchema(
  discussionMessageTable
);
export const createDiscussionMessageSchema = createInsertSchema(
  discussionMessageTable
);

