import z from 'zod';

export const createDiscussionRequestSchema = z.object({
  discussionId: z.number().positive(),
  collectiviteId: z.number().positive(),
  actionId: z.string().nonempty(),
  message: z.string().min(1),
});
