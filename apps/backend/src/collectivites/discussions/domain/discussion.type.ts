import { actionIdVarchar } from '@/backend/referentiels/models/action-definition.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  SQL_AUTH_UID,
} from '@/backend/utils/column.utils';
import { limitSchema } from '@/backend/utils/pagination.schema';
import { InferSelectModel } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  createDiscussionRequestSchema,
  listDiscussionsRequestFiltersSchema,
} from '../presentation/discussion.shemas';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const referentielEnumValues = ['cae', 'eci', 'te', 'te-test'] as const;
export type ReferentielEnum = (typeof referentielEnumValues)[number];

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

// ============================================================================
// ERROR HANDLING
// ============================================================================

export const DiscussionErrorEnum = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
  FILTERS_NOT_VALID: 'FILTERS_NOT_VALID',
  OPTIONS_NOT_VALID: 'OPTIONS_NOT_VALID',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type DiscussionError =
  (typeof DiscussionErrorEnum)[keyof typeof DiscussionErrorEnum];

export type Result<T, E = DiscussionError> =
  | { success: true; data: T }
  | { success: false; error: E };

// ============================================================================
// DATABASE TABLES
// ============================================================================

export const discussionTable = pgTable('discussion', {
  id: serial('id').primaryKey().notNull(),
  collectiviteId: integer('collectivite_id').notNull(),
  actionId: actionIdVarchar.notNull(),
  status: discussionStatutPgEnum('status').notNull(),
  createdBy: uuid('created_by').default(SQL_AUTH_UID).notNull(),
  createdAt,
  modifiedAt,
});

export type DiscussionType = InferSelectModel<typeof discussionTable>;
export type DiscussionWithActionName = DiscussionType & {
  actionNom: string;
  actionIdentifiant: string;
};
export type CreateDiscussionType = Omit<DiscussionType, 'id'>;

export const discussionMessageTable = pgTable('discussion_message', {
  id: serial('id').primaryKey(),
  discussionId: integer('discussion_id').notNull(),
  message: text('message').notNull(),
  createdBy,
  createdAt,
});

export type DiscussionMessage = InferSelectModel<
  typeof discussionMessageTable
> & {
  createdByNom: string | null;
};
export type CreateDiscussionMessageType = Omit<
  DiscussionMessage,
  'id' | 'createdByNom'
>;

export const discussionMessageSchema = createSelectSchema(
  discussionMessageTable
);
export const createDiscussionMessageSchema = createInsertSchema(
  discussionMessageTable
);

// ============================================================================
// REQUEST TYPES
// ============================================================================

export type CreateDiscussionRequest = z.infer<
  typeof createDiscussionRequestSchema
>;

export type CreateDiscussionData = {
  message: string;
  discussionId?: number;
  actionId: string;
  collectiviteId: number;
  createdBy: string;
};

export type ListDiscussionsRequestFilters = z.infer<
  typeof listDiscussionsRequestFiltersSchema
>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

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

export type DiscussionMessages = {
  id: number;
  collectiviteId: number;
  actionId: string;
  actionNom: string;
  actionIdentifiant: string;
  status: string;
  createdBy: string;
  createdAt: string;
  messages: DiscussionMessage[];
};

export type Discussion = {
  data: DiscussionMessages[];
  count: number;
};

// ============================================================================
// QUERY OPTIONS
// ============================================================================

const DEFAULT_ITEMS_NUMBER_PER_PAGE = 10;
const DEFAULT_PAGE = 1;

export const sortValues = ['actionId', 'created_at', 'status'] as const;

const sortSchema = z
  .object({ field: z.enum(sortValues), direction: z.enum(['asc', 'desc']) })
  .array()
  .optional();

export type SortOptions = z.infer<typeof sortSchema>;

const commonQueryOptionsSchema = z.object({
  sort: sortSchema,
});

const pagination = z.union([
  z.object({
    limit: z.literal('all'),
  }),
  z.object({
    page: z.coerce.number().optional().default(DEFAULT_PAGE),
    limit: limitSchema.optional().default(DEFAULT_ITEMS_NUMBER_PER_PAGE),
  }),
]);

export const queryOptionsTypeSchema = commonQueryOptionsSchema.and(pagination);
export type QueryOptionsType = z.infer<typeof queryOptionsTypeSchema>;
