import { z } from 'zod';

export const enqueueAnalysisOutputSchema = z.object({
  jobId: z.string().uuid(),
});

export type EnqueueAnalysisOutput = z.output<
  typeof enqueueAnalysisOutputSchema
>;
