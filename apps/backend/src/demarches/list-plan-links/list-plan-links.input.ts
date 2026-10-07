import { z } from 'zod';

export const listPlanLinksInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type ListPlanLinksInput = z.infer<typeof listPlanLinksInputSchema>;
