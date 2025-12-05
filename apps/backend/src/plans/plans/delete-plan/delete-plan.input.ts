import { z } from 'zod';

export const deletePlanInputSchema = z.object({
  planId: z.number().positive("L'ID du plan doit être positif"),
});

export type DeletePlanInput = z.infer<typeof deletePlanInputSchema>;

