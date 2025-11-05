import { discussionStatusValues } from '@tet/domain/collectivites';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import z from 'zod';
import { queryOptionsTypeSchema } from '../domain/discussion.query-options';

export const createDiscussionRequestSchema = z.object({
  discussionId: z.number().positive().optional(),
  collectiviteId: z.number().positive(),
  actionId: z.string().nonempty(),
  message: z
    .string()
    .min(1)
    .refine(
      (s) => s.trim().length > 0,
      'Message cannot be empty or whitespace only'
    ),
});

export const listDiscussionsRequestFiltersSchema = z.object({
  status: z.enum(discussionStatusValues).optional(),
  actionId: z.string().nonempty().optional(),
});

export const listDiscussionsRequestSchema = z.object({
  collectiviteId: z.number().positive(),
  referentielId: referentielIdEnumSchema,
  filters: listDiscussionsRequestFiltersSchema.optional(),
  options: queryOptionsTypeSchema.optional(),
});

export const deleteDiscussionAndDiscussionMessageRequestSchema = z.object({
  discussionId: z.number().positive(),
  collectiviteId: z.number().positive(),
});
export const deleteDiscussionMessageRequestSchema = z.object({
  discussionId: z.number().positive(),
  messageId: z.number().positive(),
  collectiviteId: z.number().positive(),
});

export const updateDiscussionRequestSchema = z.object({
  discussionId: z.number().positive(),
  collectiviteId: z.number().positive(),
  status: z.enum(discussionStatusValues),
});

export const updateDiscussionMessageRequestSchema = z.object({
  messageId: z.number().positive(),
  collectiviteId: z.number().positive(),
  message: z.string().min(1),
});
export type UpdateDiscussionRequest = z.infer<
  typeof updateDiscussionRequestSchema
>;

export type CreateDiscussionRequest = z.infer<
  typeof createDiscussionRequestSchema
>;

export type ListDiscussionsRequestFilters = z.infer<
  typeof listDiscussionsRequestFiltersSchema
>;

export type DeleteDiscussionAndDiscussionMessageRequest = z.infer<
  typeof deleteDiscussionAndDiscussionMessageRequestSchema
>;

export type DeleteDiscussionMessageRequest = z.infer<
  typeof deleteDiscussionMessageRequestSchema
>;

export type UpdateDiscussionMessageRequest = z.infer<
  typeof updateDiscussionMessageRequestSchema
>;

export type ListDiscussionsRequest = z.infer<
  typeof listDiscussionsRequestSchema
>;

// ============================================================================
// REQUEST TYPES
// ============================================================================

export type CreateDiscussionData = {
  message: string;
  discussionId?: number;
  actionId: string;
  collectiviteId: number;
  createdBy: string;
};

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

export type CreateDiscussionMessageResponse = {
  id: number;
  discussionId: number;
  message: string;
  createdBy: string;
  createdAt: string;
};

export type DiscussionMessage = {
  id: number;
  discussionId: number;
  message: string;
  createdBy: string;
  createdAt: string;
  createdByNom: string | null;
  createdByPrenom: string | null;
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

export type DiscussionsMessagesListType = {
  discussions: DiscussionMessages[];
  count: number;
};

export type DiscussionWithActionName = {
  data: DiscussionMessages[];
  count: number;
  actionNom: string;
  actionIdentifiant: string;
};

export type DiscussionsListType = {
  discussions: DiscussionWithActionName[];
  count: number;
};
