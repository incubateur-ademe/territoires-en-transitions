import { z } from 'zod';

export const enqueueClassificationOutputSchema = z.object({
  jobId: z.string().uuid(),
});

export type EnqueueClassificationOutput = z.output<
  typeof enqueueClassificationOutputSchema
>;
