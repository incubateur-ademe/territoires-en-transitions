import { z } from 'zod';

export const enqueueClassificationInputSchema = z.object({
  planId: z.number().int().positive(),
});

export type EnqueueClassificationInput = z.output<
  typeof enqueueClassificationInputSchema
>;
