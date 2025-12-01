import { z } from 'zod';
import { discussionStatusEnumSchema } from './discussion-status.enum';

export const discussionSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  actionId: z.string(),
  status: discussionStatusEnumSchema,
  createdBy: z.uuid(),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
});

export type Discussion = z.infer<typeof discussionSchema>;

export const discussionCreateSchema = discussionSchema.omit({ id: true });

export type DiscussionCreate = z.infer<typeof discussionCreateSchema>;

export const discussionMessageBaseSchema = z.object({
  id: z.number(),
  discussionId: z.number(),
  message: z.string(),
  createdBy: z.uuid(),
  createdAt: z.iso.datetime(),
});

export type DiscussionBaseMessage = z.infer<typeof discussionMessageBaseSchema>;

export const discussionMessageCreateSchema = discussionMessageBaseSchema.omit({
  id: true,
});

export type DiscussionMessageCreate = z.infer<
  typeof discussionMessageCreateSchema
>;

// Extended types

export const discussionMessageSchema = z.object({
  ...discussionMessageBaseSchema.shape,

  createdByNom: z.string().nullable(),
  createdByPrenom: z.string().nullable(),
});

export type DiscussionMessage = z.infer<typeof discussionMessageSchema>;

export const discussionWithMessagesSchema = z.object({
  ...discussionSchema.shape,

  actionNom: z.string(),
  actionIdentifiant: z.string(),

  messages: z.array(discussionMessageSchema),
});

export type DiscussionWithMessages = z.infer<
  typeof discussionWithMessagesSchema
>;
