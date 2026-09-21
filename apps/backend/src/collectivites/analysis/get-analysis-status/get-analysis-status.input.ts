import { z } from 'zod';

export const getAnalysisStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});

export type GetAnalysisStatusInput = z.output<
  typeof getAnalysisStatusInputSchema
>;
