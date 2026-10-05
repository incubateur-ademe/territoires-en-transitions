import { z } from 'zod';

export const listPlanSecteursCountsInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  planIds: z.array(z.number().int().positive()).min(1).max(100),
});

export type ListPlanSecteursCountsInput = z.infer<
  typeof listPlanSecteursCountsInputSchema
>;
