import { z } from 'zod';

export const verifyPlanInputSchema = z.object({
  planId: z.number().positive("L'ID du plan doit être positif"),
});

export type VerifyPlanInput = z.infer<typeof verifyPlanInputSchema>;
