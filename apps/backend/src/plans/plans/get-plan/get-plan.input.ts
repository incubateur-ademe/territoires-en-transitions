import { z } from 'zod';

export const getPlanInputSchema = z.object({
  planId: z.number().positive("L'ID du plan doit être positif"),
  collectiviteId: z.number().positive().optional(),
});

export type GetPlanInput = z.infer<typeof getPlanInputSchema>;
