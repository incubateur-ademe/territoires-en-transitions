import { z } from 'zod';

export const enqueueAnalysisOutputSchema = z.object({
  jobId: z.string().uuid(),
});

export type EnqueueClassificationOutput = z.output<
  typeof enqueueAnalysisOutputSchema
>;
