import { z } from 'zod';

export const getReferentsAccessInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type GetReferentsAccessInput = z.infer<
  typeof getReferentsAccessInputSchema
>;
