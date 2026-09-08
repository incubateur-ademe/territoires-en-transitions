import { z } from 'zod';

export const getClassificationStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});

export type GetClassificationStatusInput = z.output<
  typeof getClassificationStatusInputSchema
>;
