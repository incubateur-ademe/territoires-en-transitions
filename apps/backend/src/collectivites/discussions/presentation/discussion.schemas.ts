import z from 'zod';
import { queryOptionsTypeSchema } from '../domain/discussion.query-options';
import {
  discussionStatutEnumValues,
  referentielEnumValues,
} from '../domain/discussion.types';

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
  status: z.enum(discussionStatutEnumValues).optional(),
  actionId: z.string().nonempty().optional(),
});

export const listDiscussionsRequestSchema = z.object({
  collectiviteId: z.number().positive(),
  referentielId: z.enum(referentielEnumValues),
  filters: listDiscussionsRequestFiltersSchema.optional(),
  options: queryOptionsTypeSchema.optional(),
});

export const deleteDiscussionAndDiscussionMessageRequestSchema = z.object({
  discussionId: z.number().positive(),
  collectiviteId: z.number().positive(),
});
export const deleteDiscussionMessageRequestSchema = z.object({
  messageId: z.number().positive(),
  collectiviteId: z.number().positive(),
});

export const updateDiscussionRequestSchema = z.object({
  discussionId: z.number().positive(),
  collectiviteId: z.number().positive(),
  status: z.enum(discussionStatutEnumValues),
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
