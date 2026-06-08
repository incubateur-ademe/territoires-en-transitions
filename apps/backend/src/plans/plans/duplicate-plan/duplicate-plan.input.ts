import { z } from 'zod';

export const duplicatePlanInputSchema = z.object({
  planId: z.number().positive("L'ID du plan doit être positif"),
});

export type DuplicatePlanInput = z.infer<typeof duplicatePlanInputSchema>;
