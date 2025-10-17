import { actionIdVarchar } from '@/backend/referentiels/models/action-definition.table';
import { createdAt, createdBy, modifiedAt } from '@/backend/utils/column.utils';
import { InferSelectModel } from 'drizzle-orm';
import { integer, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { createDiscussionRequestSchema } from '../presentation/discussion.shemas';

type DiscussionFilters = {
  collectiviteId: number;
  actionId: string;
  status: DiscussionStatut;
};

export type { DiscussionFilters };

export const DiscussionErrorEnum = {
  DISCUSSION_NOT_FOUND: 'DISCUSSION_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type DiscussionError =
  (typeof DiscussionErrorEnum)[keyof typeof DiscussionErrorEnum];

export type Result<T, E = DiscussionError> =
  | { success: true; data: T }
  | { success: false; error: E };

export const DiscussionStatutEnum = {
  OUVERT: 'ouvert',
  FERME: 'ferme',
} as const;

export const discussionStatutEnumValues = [
  DiscussionStatutEnum.OUVERT,
  DiscussionStatutEnum.FERME,
] as const;

export const discussionStatutEnumSchema = z.enum(discussionStatutEnumValues);
export const discussionStatutPgEnum = pgEnum(
  'discussion_statut',
  discussionStatutEnumValues
);
export type DiscussionStatut = z.infer<typeof discussionStatutEnumSchema>;

// DISCUSSION TABLE TYPE
export const discussionTable = pgTable('discussion', {
  id: serial('id').primaryKey().notNull(),
  collectiviteId: integer('collectivite_id').notNull(),
  actionId: actionIdVarchar.notNull(),
  status: discussionStatutPgEnum('status').notNull(),
  createdBy,
  createdAt,
  modifiedAt,
});

export type DiscussionType = InferSelectModel<typeof discussionTable>;
export type CreateDiscussionType = Omit<DiscussionType, 'id'>;

// DISCUSSION MESSAGE TABLE TYPE
export const discussionMessageTable = pgTable('discussion_message', {
  id: serial('id').primaryKey(),
  discussionId: integer('discussion_id').notNull(),
  message: text('message').notNull(),
  createdBy,
  createdAt,
});

export type DiscussionMessageType = InferSelectModel<
  typeof discussionMessageTable
>;
export type CreateDiscussionMessageType = Omit<DiscussionMessageType, 'id'>;

export const discussionMessageSchema = createSelectSchema(
  discussionMessageTable
);
export const createDiscussionMessageSchema = createInsertSchema(
  discussionMessageTable
);

export type CreateDiscussionRequest = z.infer<
  typeof createDiscussionRequestSchema
>;

export type CreateDiscussionResponse = {
  id: number;
  messageId: number;
  collectiviteId: number;
  actionId: string;
  message: string;
  status: string;
  createdBy: string;
  createdAt: string;
};

export type CreateDiscussionData = {
  message: string;
  discussionId: number;
  actionId: string;
  collectiviteId: number;
  createdBy: string;
};
