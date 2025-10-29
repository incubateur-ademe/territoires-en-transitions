import z from 'zod';
import {
  discussionStatutEnumValues,
  queryOptionsTypeSchema,
  referentielEnumValues,
} from '../domain/discussion.type';

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

export const deleteDiscussionMessageRequestSchema = z.object({
  discussionMessageId: z.number().positive(),
  collectiviteId: z.number().positive(),
});

export const updateDiscussionRequestSchema = z.object({
  discussionId: z.number().positive(),
  collectiviteId: z.number().positive(),
  status: z.enum(discussionStatutEnumValues),
});
