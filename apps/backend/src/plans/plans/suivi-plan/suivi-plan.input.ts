import { z } from 'zod';

export const suiviPlanBlocInputSchema = z.object({
  planId: z.number().int().positive(),
  thematiqueIds: z.array(z.number().int()).optional(),
});

export type SuiviPlanBlocInput = z.infer<typeof suiviPlanBlocInputSchema>;
